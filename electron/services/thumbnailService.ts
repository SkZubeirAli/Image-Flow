import sharp from 'sharp';

const THUMB_WIDTH = 220;

/**
 * Produces a small JPEG thumbnail encoded as a data URL, safe to keep in
 * React state for every queued image without exhausting memory the way
 * full-resolution buffers would.
 */
export async function generateThumbnail(filePath: string): Promise<string> {
  const buffer = await sharp(filePath, { failOn: 'none' })
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}
