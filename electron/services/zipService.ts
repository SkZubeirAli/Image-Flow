import archiver from 'archiver';
import unzipper from 'unzipper';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { SUPPORTED_EXTENSIONS } from '../types';

/**
 * Extracts a ZIP file to a fresh temp directory under the OS temp folder,
 * returning paths of every supported image found inside. Unsupported files
 * are ignored. Caller is responsible for calling cleanupTempDir afterwards.
 */
export async function extractZipImages(
  zipPath: string
): Promise<{ tempDir: string; imagePaths: string[]; skipped: string[] }> {
  const tempDir = path.join(os.tmpdir(), `imageflow-import-${randomUUID()}`);
  await fsp.mkdir(tempDir, { recursive: true });

  await fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: tempDir }))
    .promise();

  const imagePaths: string[] = [];
  const skipped: string[] = [];

  async function walk(dir: string) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (SUPPORTED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        imagePaths.push(full);
      } else {
        skipped.push(entry.name);
      }
    }
  }
  await walk(tempDir);

  return { tempDir, imagePaths, skipped };
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  await fsp.rm(tempDir, { recursive: true, force: true });
}

/**
 * Creates a ZIP archive from a list of { filePath, arcName } entries,
 * writing progress via onProgress(bytesWritten, totalBytesEstimate).
 */
export async function createZipArchive(
  entries: Array<{ filePath: string; arcName: string }>,
  outputZipPath: string,
  onProgress?: (processedCount: number, total: number) => void
): Promise<void> {
  await fsp.mkdir(path.dirname(outputZipPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    let processed = 0;

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));
    archive.on('entry', () => {
      processed++;
      onProgress?.(processed, entries.length);
    });

    archive.pipe(output);
    for (const entry of entries) {
      archive.file(entry.filePath, { name: entry.arcName });
    }
    archive.finalize();
  });
}
