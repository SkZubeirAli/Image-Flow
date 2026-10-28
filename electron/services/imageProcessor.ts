import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  ProcessingSettings,
  ImageItem,
  ImageMetadataInfo,
  OutputFormat
} from '../types';

// Newer sharp releases have changed how their .d.ts exposes the `Sharp`
// instance and `FitEnum` types across versions (sometimes a merged
// namespace, sometimes not), which breaks `sharp.Sharp` / `sharp.FitEnum`
// namespace-style type references depending on which version npm resolves.
// Deriving the instance type from the function itself, and using a plain
// string-literal union for fit, keeps this file working across versions.
type SharpInstance = ReturnType<typeof sharp>;
type SharpFit = 'contain' | 'cover' | 'fill' | 'inside' | 'outside';

export interface ProcessResult {
  outputBuffer: Buffer;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

/** Reads metadata for a source file without decoding full pixel data into memory. */
export async function readImageMetadata(filePath: string): Promise<ImageMetadataInfo> {
  const stat = await fs.stat(filePath);
  const meta = await sharp(filePath, { failOn: 'none' }).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: (meta.format ?? path.extname(filePath).replace('.', '')).toLowerCase(),
    sizeBytes: stat.size,
    colorSpace: meta.space,
    orientation: meta.orientation,
    hasAlpha: meta.hasAlpha
  };
}

function targetBytes(settings: ProcessingSettings['compression']): number {
  return settings.targetUnit === 'MB' ? settings.targetSize * 1024 * 1024 : settings.targetSize * 1024;
}

function resolveOutputExtensionFormat(
  format: OutputFormat,
  sourceFormat: string
): 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff' {
  if (format !== 'original') return format as any;
  const src = sourceFormat.toLowerCase();
  if (src === 'jpg') return 'jpeg';
  if (['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'].includes(src)) return src as any;
  return 'jpeg';
}

function computeResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  resize: ProcessingSettings['resize']
): { width?: number; height?: number } {
  if (resize.mode === 'original') return {};
  if (resize.mode === 'percentage') {
    const scale = Math.max(1, resize.percentage) / 100;
    return {
      width: Math.max(1, Math.round(originalWidth * scale)),
      height: Math.max(1, Math.round(originalHeight * scale))
    };
  }
  if (resize.mode === 'width') {
    if (!resize.maintainAspectRatio) return { width: resize.width };
    return { width: resize.width };
  }
  if (resize.mode === 'height') {
    return { height: resize.height };
  }
  // exact
  return { width: resize.width, height: resize.height };
}

function sharpFitFor(mode: ProcessingSettings['resize']['fit'], resizeMode: string): SharpFit {
  // "fill"/"stretch" only make sense with exact both dimensions; for single
  // dimension resize we always preserve aspect ratio (sharp's default when
  // only one of width/height is given already behaves like "inside").
  if (resizeMode !== 'exact') return 'inside';
  if (mode === 'stretch') return 'fill';
  if (mode === 'fill') return 'cover';
  return 'contain'; // "fit"
}

/**
 * Applies resize + format + quality settings once, returning the resulting
 * buffer. Does not attempt target-size search — see compressToTargetSize.
 */
async function renderOnce(
  input: SharpInstance,
  settings: ProcessingSettings,
  sourceFormat: string,
  quality: number
): Promise<ProcessResult> {
  const outFormat = resolveOutputExtensionFormat(settings.format.output, sourceFormat);
  let pipeline = input.clone();

  const dims = await pipeline.metadata();
  const targetDims = computeResizeDimensions(dims.width ?? 0, dims.height ?? 0, settings.resize);

  if (targetDims.width || targetDims.height) {
    pipeline = pipeline.resize({
      width: targetDims.width,
      height: targetDims.height,
      fit: sharpFitFor(settings.resize.fit, settings.resize.mode),
      withoutEnlargement: false
    });
  }

  // Flatten transparency onto a background color if converting to a format
  // without alpha support (JPEG has no alpha channel).
  if (outFormat === 'jpeg') {
    const bg =
      settings.format.backgroundColor === 'black'
        ? '#000000'
        : settings.format.backgroundColor === 'custom'
        ? settings.format.customBackgroundHex || '#FFFFFF'
        : '#FFFFFF';
    pipeline = pipeline.flatten({ background: bg });
  }

  if (!settings.metadata.preserveMetadata) {
    pipeline = pipeline.withMetadata({});
    // withMetadata({}) with no keys still copies orientation by default in
    // sharp; explicitly strip via rotate() + toFormat without metadata call.
  } else {
    pipeline = pipeline.withMetadata();
  }

  switch (outFormat) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: Math.round(quality), mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({
        compressionLevel: settings.format.pngCompressionLevel,
        quality: Math.round(quality)
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: Math.round(quality) });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: Math.round(quality) });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
    case 'tiff':
      pipeline = pipeline.tiff({ quality: Math.round(quality) });
      break;
  }

  const outputBuffer = await pipeline.toBuffer();
  const outMeta = await sharp(outputBuffer).metadata();

  return {
    outputBuffer,
    width: outMeta.width ?? 0,
    height: outMeta.height ?? 0,
    format: outFormat,
    sizeBytes: outputBuffer.length
  };
}

/**
 * Binary-searches the JPEG/WEBP/AVIF quality parameter to approach the
 * requested target file size as closely as reasonably possible. PNG is
 * lossless, so if the user wants a target size on a PNG-only pipeline we
 * fall back to a single best-effort render and rely on
 * allowFormatConversionForTarget for anything better.
 */
async function compressToTargetSize(
  input: SharpInstance,
  settings: ProcessingSettings,
  sourceFormat: string
): Promise<ProcessResult> {
  const wantBytes = targetBytes(settings.compression);
  let outFormat = resolveOutputExtensionFormat(settings.format.output, sourceFormat);

  const lossyFormats: Array<'jpeg' | 'webp' | 'avif'> = ['jpeg', 'webp', 'avif'];
  const canBinarySearch = lossyFormats.includes(outFormat as any);

  if (!canBinarySearch) {
    if (settings.compression.allowFormatConversionForTarget) {
      // PNG (or original==PNG with no explicit format) can't hit an
      // arbitrary target size losslessly, so convert to WEBP, which
      // preserves transparency and compresses well.
      outFormat = 'webp';
    } else {
      // Best-effort single render; exact target size cannot be guaranteed.
      return renderOnce(input, settings, sourceFormat, settings.compression.quality);
    }
  }

  const effectiveSettings: ProcessingSettings = {
    ...settings,
    format: { ...settings.format, output: outFormat as OutputFormat }
  };

  let low = 5;
  let high = 95;
  let best: ProcessResult | null = null;
  const maxIterations = 8;

  for (let i = 0; i < maxIterations; i++) {
    const mid = Math.round((low + high) / 2);
    const result = await renderOnce(input, effectiveSettings, sourceFormat, mid);

    if (!best || Math.abs(result.sizeBytes - wantBytes) < Math.abs(best.sizeBytes - wantBytes)) {
      best = result;
    }

    if (result.sizeBytes > wantBytes) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
    if (low > high) break;
  }

  return best ?? renderOnce(input, effectiveSettings, sourceFormat, 60);
}

export async function processImage(
  sourcePath: string,
  settings: ProcessingSettings
): Promise<ProcessResult> {
  const buffer = await fs.readFile(sourcePath);
  const input = sharp(buffer, { failOn: 'none' }).rotate(); // rotate() auto-applies EXIF orientation
  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const sourceFormat = (meta.format ?? path.extname(sourcePath).replace('.', '')).toLowerCase();

  if (settings.compression.mode === 'targetSize') {
    return compressToTargetSize(input, settings, sourceFormat);
  }
  return renderOnce(input, settings, sourceFormat, settings.compression.quality);
}

export function buildOutputFileMeta(
  item: Pick<ImageItem, 'fileName'>,
  result: ProcessResult
): { extension: string } {
  const extMap: Record<string, string> = {
    jpeg: '.jpg',
    png: '.png',
    webp: '.webp',
    avif: '.avif',
    gif: '.gif',
    tiff: '.tiff'
  };
  return { extension: extMap[result.format] ?? `.${result.format}` };
}
