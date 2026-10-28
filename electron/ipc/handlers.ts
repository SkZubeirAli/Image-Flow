import { ipcMain, BrowserWindow, app } from 'electron';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

import {
  selectImageFiles,
  selectFolder,
  selectZipFile,
  selectOutputFolder,
  selectZipSavePath,
  openFolderInExplorer,
  getSafeOutputPath,
  writeFileBuffer,
  ensureDir
} from '../services/fileService';
import { generateThumbnail } from '../services/thumbnailService';
import { readImageMetadata, processImage, buildOutputFileMeta } from '../services/imageProcessor';
import { extractZipImages, cleanupTempDir, createZipArchive } from '../services/zipService';
import { computeOutputBaseName, dedupeBaseNames } from '../services/renameService';
import { ConcurrencyQueue } from '../services/concurrencyQueue';
import { ImageItem, ProcessingSettings, AppSettings, DEFAULT_APP_SETTINGS } from '../types';

interface InternalRecord {
  sourcePath: string;
  originalMeta: ImageItem['original'];
  outputTempPath?: string;
  outputMeta?: ImageItem['output'];
  status: ImageItem['status'];
  errorMessage?: string;
  fileName: string;
}

const registry = new Map<string, InternalRecord>();
const zipTempDirs = new Set<string>();
let sessionOutputDir: string | null = null;
let concurrencyQueue = new ConcurrencyQueue(3);
let isProcessing = false;

function getSessionOutputDir(): string {
  if (!sessionOutputDir) {
    sessionOutputDir = path.join(os.tmpdir(), `imageflow-session-${randomUUID()}`);
  }
  return sessionOutputDir;
}

async function settingsFilePath(): Promise<string> {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(await settingsFilePath(), 'utf-8');
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await fs.writeFile(await settingsFilePath(), JSON.stringify(settings, null, 2), 'utf-8');
}

async function buildImageItem(sourcePath: string): Promise<ImageItem> {
  const id = randomUUID();
  const [meta, thumb] = await Promise.all([
    readImageMetadata(sourcePath),
    generateThumbnail(sourcePath).catch(() => undefined)
  ]);
  registry.set(id, {
    sourcePath,
    originalMeta: meta,
    status: 'waiting',
    fileName: path.basename(sourcePath)
  });
  return {
    id,
    sourcePath,
    fileName: path.basename(sourcePath),
    thumbnailDataUrl: thumb,
    original: meta,
    status: 'waiting'
  };
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle('dialog:selectImages', async () => {
    const win = getMainWindow();
    if (!win) return [];
    const files = await selectImageFiles(win);
    return Promise.all(files.map(buildImageItem));
  });

  ipcMain.handle('dialog:selectFolder', async () => {
    const win = getMainWindow();
    if (!win) return [];
    const files = await selectFolder(win);
    return Promise.all(files.map(buildImageItem));
  });

  ipcMain.handle('dialog:importZip', async () => {
    const win = getMainWindow();
    if (!win) return { images: [], skipped: [] };
    const zipPath = await selectZipFile(win);
    if (!zipPath) return { images: [], skipped: [] };
    const { tempDir, imagePaths, skipped } = await extractZipImages(zipPath);
    zipTempDirs.add(tempDir);
    const images = await Promise.all(imagePaths.map(buildImageItem));
    return { images, skipped };
  });

  ipcMain.handle('queue:remove', async (_e, id: string) => {
    registry.delete(id);
    return true;
  });

  ipcMain.handle('queue:clear', async () => {
    registry.clear();
    for (const dir of zipTempDirs) {
      await cleanupTempDir(dir);
    }
    zipTempDirs.clear();
    return true;
  });

  ipcMain.handle('settings:get', async () => loadSettings());
  ipcMain.handle('settings:set', async (_e, settings: AppSettings) => {
    await saveSettings(settings);
    return true;
  });

  ipcMain.handle(
    'process:start',
    async (event, payload: { ids: string[]; settings: ProcessingSettings; maxConcurrent: number }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;
      isProcessing = true;
      concurrencyQueue = new ConcurrencyQueue(payload.maxConcurrent);
      const outDir = getSessionOutputDir();
      await ensureDir(outDir);

      const total = payload.ids.length;
      let completed = 0;
      let failed = 0;
      const startedAt = Date.now();

      const baseNames = payload.ids.map((id, index) => {
        const rec = registry.get(id);
        return computeOutputBaseName(rec?.fileName ?? `image_${index}`, index, payload.settings.rename);
      });
      const dedupedBases = dedupeBaseNames(baseNames);

      const sendProgress = (currentFileName: string | null, statusLabel: string) => {
        const elapsedSec = (Date.now() - startedAt) / 1000;
        const rate = completed > 0 ? elapsedSec / completed : null;
        const remaining = total - completed - failed;
        win.webContents.send('process:progress', {
          total,
          completed,
          failed,
          currentFileName,
          currentStatusLabel: statusLabel,
          isProcessing: true,
          startedAt,
          etaSeconds: rate ? Math.max(0, Math.round(rate * remaining)) : null
        });
      };

      sendProgress(null, 'Starting...');

      await Promise.all(
        payload.ids.map((id, index) =>
          concurrencyQueue.run(async () => {
            if (concurrencyQueue.isCancelled()) return;
            const rec = registry.get(id);
            if (!rec) return;
            rec.status = 'processing';
            win.webContents.send('image:update', { id, status: 'processing' });
            sendProgress(rec.fileName, 'Processing...');

            try {
              const result = await processImage(rec.sourcePath, payload.settings);
              if (concurrencyQueue.isCancelled()) {
                rec.status = 'cancelled';
                win.webContents.send('image:update', { id, status: 'cancelled' });
                return;
              }
              const { extension } = buildOutputFileMeta(rec, result);
              const outFileName = `${dedupedBases[index]}${extension}`;
              const tempPath = path.join(outDir, `${id}${extension}`);
              await writeFileBuffer(tempPath, result.outputBuffer);

              rec.outputTempPath = tempPath;
              rec.outputMeta = {
                fileName: outFileName,
                width: result.width,
                height: result.height,
                sizeBytes: result.sizeBytes,
                format: result.format
              };
              rec.status = 'completed';
              completed++;
              win.webContents.send('image:update', {
                id,
                status: 'completed',
                output: rec.outputMeta
              });
            } catch (err: any) {
              rec.status = 'failed';
              rec.errorMessage = friendlyError(err);
              failed++;
              win.webContents.send('image:update', {
                id,
                status: 'failed',
                errorMessage: rec.errorMessage
              });
            }
            sendProgress(rec.fileName, 'Processing...');
          })
        )
      );

      isProcessing = false;
      win.webContents.send('process:progress', {
        total,
        completed,
        failed,
        currentFileName: null,
        currentStatusLabel: concurrencyQueue.isCancelled() ? 'Cancelled' : 'Complete',
        isProcessing: false,
        startedAt,
        etaSeconds: 0
      });
    }
  );

  ipcMain.handle('process:cancel', async () => {
    concurrencyQueue.cancel();
    return true;
  });

  ipcMain.handle('process:retry', async (event, payload: { id: string; settings: ProcessingSettings }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const rec = registry.get(payload.id);
    if (!win || !rec) return;
    rec.status = 'processing';
    win.webContents.send('image:update', { id: payload.id, status: 'processing' });
    try {
      const result = await processImage(rec.sourcePath, payload.settings);
      const { extension } = buildOutputFileMeta(rec, result);
      const outDir = getSessionOutputDir();
      const tempPath = path.join(outDir, `${payload.id}${extension}`);
      await writeFileBuffer(tempPath, result.outputBuffer);
      rec.outputTempPath = tempPath;
      rec.outputMeta = {
        fileName: rec.outputMeta?.fileName ?? `${path.parse(rec.fileName).name}${extension}`,
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
        format: result.format
      };
      rec.status = 'completed';
      win.webContents.send('image:update', { id: payload.id, status: 'completed', output: rec.outputMeta });
    } catch (err: any) {
      rec.status = 'failed';
      rec.errorMessage = friendlyError(err);
      win.webContents.send('image:update', { id: payload.id, status: 'failed', errorMessage: rec.errorMessage });
    }
  });

  ipcMain.handle('preview:get', async (_e, id: string) => {
    const rec = registry.get(id);
    if (!rec) return null;
    const originalBuf = await fs.readFile(rec.sourcePath);
    const originalDataUrl = `data:image/${rec.originalMeta.format};base64,${originalBuf.toString('base64')}`;
    let processedDataUrl: string | null = null;
    if (rec.outputTempPath) {
      const processedBuf = await fs.readFile(rec.outputTempPath);
      processedDataUrl = `data:image/${rec.outputMeta?.format ?? 'jpeg'};base64,${processedBuf.toString(
        'base64'
      )}`;
    }
    return { originalDataUrl, processedDataUrl, original: rec.originalMeta, output: rec.outputMeta };
  });

  ipcMain.handle('export:selectFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    return selectOutputFolder(win);
  });

  ipcMain.handle(
    'export:saveOne',
    async (event, payload: { id: string; askOverwrite: boolean }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      const rec = registry.get(payload.id);
      if (!win || !rec || !rec.outputTempPath || !rec.outputMeta) return null;
      const folder = await selectOutputFolder(win);
      if (!folder) return null;
      const destPath = await getSafeOutputPath(folder, rec.outputMeta.fileName, !payload.askOverwrite);
      const buffer = await fs.readFile(rec.outputTempPath);
      await writeFileBuffer(destPath, buffer);
      return destPath;
    }
  );

  ipcMain.handle(
    'export:all',
    async (event, payload: { ids: string[]; askOverwrite: boolean }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return null;
      const folder = await selectOutputFolder(win);
      if (!folder) return null;
      let exported = 0;
      for (const id of payload.ids) {
        const rec = registry.get(id);
        if (!rec?.outputTempPath || !rec.outputMeta) continue;
        const destPath = await getSafeOutputPath(folder, rec.outputMeta.fileName, !payload.askOverwrite);
        const buffer = await fs.readFile(rec.outputTempPath);
        await writeFileBuffer(destPath, buffer);
        exported++;
        win.webContents.send('export:progress', { exported, total: payload.ids.length });
      }
      return folder;
    }
  );

  ipcMain.handle('export:zip', async (event, payload: { ids: string[] }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const zipPath = await selectZipSavePath(win, 'ImageFlow_Export.zip');
    if (!zipPath) return null;
    const entries = payload.ids
      .map((id) => registry.get(id))
      .filter((rec): rec is InternalRecord => !!rec?.outputTempPath && !!rec.outputMeta)
      .map((rec) => ({ filePath: rec.outputTempPath as string, arcName: rec.outputMeta!.fileName }));

    await createZipArchive(entries, zipPath, (processed, total) => {
      win.webContents.send('export:progress', { exported: processed, total });
    });
    return zipPath;
  });

  ipcMain.handle('export:openFolder', async (_e, folderPath: string) => {
    await openFolderInExplorer(folderPath);
    return true;
  });

  app.on('before-quit', async () => {
    for (const dir of zipTempDirs) await cleanupTempDir(dir).catch(() => {});
    if (sessionOutputDir) await cleanupTempDir(sessionOutputDir).catch(() => {});
  });
}

function friendlyError(err: any): string {
  const msg = String(err?.message ?? err ?? '');
  if (/unsupported image format|Input buffer contains unsupported image format/i.test(msg)) {
    return 'Unable to process image because the file format is not supported or the file appears to be corrupted.';
  }
  if (/ENOENT/.test(msg)) return 'The file could not be found. It may have been moved or deleted.';
  if (/EACCES|EPERM/.test(msg)) return 'Permission denied while reading or writing this file.';
  if (/ENOSPC/.test(msg)) return 'Not enough disk space to complete this operation.';
  return 'Unable to process this image due to an unexpected error.';
}
