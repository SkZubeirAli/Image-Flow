/// <reference types="vite/client" />

interface Window {
  api: {
    selectImages: () => Promise<import('./types').ImageItem[]>;
    selectFolder: () => Promise<import('./types').ImageItem[]>;
    importZip: () => Promise<{ images: import('./types').ImageItem[]; skipped: string[] }>;

    removeImage: (id: string) => Promise<boolean>;
    clearQueue: () => Promise<boolean>;

    getSettings: () => Promise<import('./types').AppSettings>;
    setSettings: (settings: import('./types').AppSettings) => Promise<boolean>;

    startProcessing: (payload: {
      ids: string[];
      settings: import('./types').ProcessingSettings;
      maxConcurrent: number;
    }) => Promise<void>;
    cancelProcessing: () => Promise<boolean>;
    retryImage: (payload: { id: string; settings: import('./types').ProcessingSettings }) => Promise<void>;

    getPreview: (id: string) => Promise<{
      originalDataUrl: string;
      processedDataUrl: string | null;
      original: import('./types').ImageMetadataInfo;
      output?: import('./types').ImageItem['output'];
    } | null>;

    selectExportFolder: () => Promise<string | null>;
    exportOne: (payload: { id: string; askOverwrite: boolean }) => Promise<string | null>;
    exportAll: (payload: { ids: string[]; askOverwrite: boolean }) => Promise<string | null>;
    exportZip: (payload: { ids: string[] }) => Promise<string | null>;
    openFolder: (folderPath: string) => Promise<boolean>;

    onProgress: (cb: (progress: import('./types').OverallProgress) => void) => () => void;
    onImageUpdate: (cb: (update: Partial<import('./types').ImageItem> & { id: string }) => void) => () => void;
    onExportProgress: (cb: (data: { exported: number; total: number }) => void) => () => void;
  };
}
