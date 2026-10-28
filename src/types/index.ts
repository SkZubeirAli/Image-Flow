// Shared types used by both the renderer (React) and, structurally, the
// electron main process. The main process has its own copy in
// electron/types.ts to avoid renderer code ever being imported into main.

export type ImageStatus =
  | 'waiting'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ResizeMode = 'original' | 'width' | 'height' | 'exact' | 'percentage';
export type FitMode = 'fit' | 'fill' | 'stretch';
export type CompressionMode = 'quality' | 'targetSize';
export type SizeUnit = 'KB' | 'MB';
export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp' | 'avif';
export type RenameMode = 'keep' | 'replace' | 'prefix' | 'suffix' | 'sequence';
export type BackgroundColor = 'white' | 'black' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ResizeSettings {
  mode: ResizeMode;
  width: number;
  height: number;
  percentage: number;
  maintainAspectRatio: boolean;
  fit: FitMode;
}

export interface CompressionSettings {
  mode: CompressionMode;
  quality: number; // 0-100
  targetSize: number;
  targetUnit: SizeUnit;
  allowFormatConversionForTarget: boolean;
}

export interface FormatSettings {
  output: OutputFormat;
  jpegQuality: number;
  webpQuality: number;
  pngCompressionLevel: number; // 0-9
  backgroundColor: BackgroundColor;
  customBackgroundHex: string;
}

export interface RenameSettings {
  mode: RenameMode;
  replaceWith: string;
  prefix: string;
  suffix: string;
  sequenceStart: number;
  sequencePadding: number;
  findText: string;
  replaceText: string;
}

export interface MetadataSettings {
  preserveMetadata: boolean;
}

export interface ProcessingSettings {
  resize: ResizeSettings;
  compression: CompressionSettings;
  format: FormatSettings;
  rename: RenameSettings;
  metadata: MetadataSettings;
}

export interface AppSettings {
  theme: ThemeMode;
  defaultOutputFormat: OutputFormat;
  defaultQuality: number;
  maintainAspectRatioDefault: boolean;
  maxConcurrent: number;
  preserveMetadataDefault: boolean;
  askBeforeOverwrite: boolean;
  outputFolderName: string;
}

export interface ImageMetadataInfo {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  colorSpace?: string;
  orientation?: number;
  hasAlpha?: boolean;
}

export interface ImageItem {
  id: string;
  sourcePath: string;
  fileName: string;
  thumbnailDataUrl?: string;
  original: ImageMetadataInfo;
  output?: {
    fileName: string;
    outputPath?: string;
    width: number;
    height: number;
    sizeBytes: number;
    format: string;
  };
  status: ImageStatus;
  errorMessage?: string;
}

export interface OverallProgress {
  total: number;
  completed: number;
  failed: number;
  currentFileName: string | null;
  currentStatusLabel: string;
  isProcessing: boolean;
  startedAt: number | null;
  etaSeconds: number | null;
}

export interface ProcessingSummary {
  totalImages: number;
  originalTotalBytes: number;
  outputTotalBytes: number;
  failedCount: number;
}

export interface ImportResult {
  images: ImageItem[];
  skipped: string[];
}

export const SUPPORTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif'
];
