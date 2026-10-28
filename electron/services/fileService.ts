import { dialog, shell, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { SUPPORTED_EXTENSIONS } from '../types';

export async function selectImageFiles(win: BrowserWindow): Promise<string[]> {
  const result = await dialog.showOpenDialog(win, {
    title: 'Select images',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Images',
        extensions: SUPPORTED_EXTENSIONS.map((e) => e.replace('.', ''))
      }
    ]
  });
  if (result.canceled) return [];
  return result.filePaths;
}

export async function selectFolder(win: BrowserWindow): Promise<string[]> {
  const result = await dialog.showOpenDialog(win, {
    title: 'Select a folder of images',
    properties: ['openDirectory']
  });
  if (result.canceled) return [];
  return collectImagesInDirectory(result.filePaths[0]);
}

export async function selectZipFile(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    title: 'Import ZIP',
    properties: ['openFile'],
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}

export async function selectOutputFolder(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    title: 'Choose export folder',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}

export async function selectZipSavePath(win: BrowserWindow, defaultName: string): Promise<string | null> {
  const result = await dialog.showSaveDialog(win, {
    title: 'Export as ZIP',
    defaultPath: defaultName,
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
}

export async function collectImagesInDirectory(dir: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(current: string) {
    let entries: fssync.Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (SUPPORTED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        found.push(full);
      }
    }
  }
  await walk(dir);
  return found;
}

/** Ensures a directory exists, creating parents as needed. */
export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Returns a filename guaranteed not to collide with an existing file in
 * `dir`, following the `image.jpg`, `image_1.jpg`, `image_2.jpg` pattern.
 * Never silently overwrites unless `allowOverwrite` is true.
 */
export async function getSafeOutputPath(
  dir: string,
  fileName: string,
  allowOverwrite: boolean
): Promise<string> {
  if (allowOverwrite) return path.join(dir, fileName);

  const ext = path.extname(fileName);
  const base = fileName.slice(0, fileName.length - ext.length);
  let candidate = path.join(dir, fileName);
  let counter = 1;
  while (fssync.existsSync(candidate)) {
    candidate = path.join(dir, `${base}_${counter}${ext}`);
    counter++;
  }
  return candidate;
}

export async function openFolderInExplorer(folderPath: string): Promise<void> {
  await shell.openPath(folderPath);
}

export async function writeFileBuffer(filePath: string, buffer: Buffer): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, buffer);
}

export async function removeDirRecursive(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}
