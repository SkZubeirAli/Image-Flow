export type ImageStatus = 'waiting' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ResizeMode = 'original' | 'width' | 'height' | 'exact' | 'percentage';
export type FitMode = 'fit' | 'fill' | 'stretch';
export type CompressionMode = 'quality' | 'targetSize';
export type SizeUnit = 'KB' | 'MB';
export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp' | 'avif';
export type RenameMode = 'keep' | 'replace' | 'prefix' | 'suffix' | 'sequence';
export type BackgroundColor = 'white' | 'black' | 'custom';

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
  quality: number;
  targetSize: number;
  targetUnit: SizeUnit;
  allowFormatConversionForTarget: boolean;
}

export interface FormatSettings {
  output: OutputFormat;
  jpegQuality: number;
  webpQuality: number;
  pngCompressionLevel: number;
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

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultOutputFormat: OutputFormat;
  defaultQuality: number;
  maintainAspectRatioDefault: boolean;
  maxConcurrent: number;
  preserveMetadataDefault: boolean;
  askBeforeOverwrite: boolean;
  outputFolderName: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  defaultOutputFormat: 'original',
  defaultQuality: 80,
  maintainAspectRatioDefault: true,
  maxConcurrent: 3,
  preserveMetadataDefault: true,
  askBeforeOverwrite: true,
  outputFolderName: 'ImageFlow_Output'
};
