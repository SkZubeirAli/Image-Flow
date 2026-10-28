import React, { useCallback, useState } from 'react';
import { UploadCloud, FolderOpen, FileArchive, ImagePlus } from 'lucide-react';
import { useApp } from '@/stores/AppContext';

const SUPPORTED_LABEL = 'Supports JPG, JPEG, PNG, WEBP, GIF, BMP, TIFF';

export function Dropzone() {
  const { dispatch } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSelectImages = async () => {
    const images = await window.api.selectImages();
    if (images.length) dispatch({ type: 'ADD_IMAGES', images });
  };

  const handleSelectFolder = async () => {
    const images = await window.api.selectFolder();
    if (images.length) dispatch({ type: 'ADD_IMAGES', images });
  };

  const handleImportZip = async () => {
    const { images, skipped } = await window.api.importZip();
    if (images.length) {
      dispatch({ type: 'ADD_IMAGES', images });
      setNotice(`${images.length} image${images.length === 1 ? '' : 's'} found in ZIP.`);
    }
    if (skipped.length) {
      setNotice((prev) => `${prev ? prev + ' ' : ''}${skipped.length} unsupported file(s) skipped.`);
    }
  };

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      const zip = files.find((f) => f.name.toLowerCase().endsWith('.zip'));
      if (zip) {
        // Electron's renderer drag/drop doesn't give a real filesystem path
        // reliably across all setups, so ZIPs dropped in are routed through
        // the same native dialog-backed import for consistent, safe access.
        await handleImportZip();
        return;
      }
      const supported = files.filter((f) =>
        /\.(jpg|jpeg|png|webp|gif|bmp|tiff?|)$/i.test(f.name)
      );
      if (supported.length === 0) {
        setNotice('Unsupported file type.');
        return;
      }
      // For actual file ingestion we route through the native picker so the
      // main process gets validated, real filesystem paths (renderer drag
      // events only expose limited File objects under contextIsolation).
      await handleSelectImages();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-16">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`flex w-full max-w-xl flex-col items-center rounded-card border-2 border-dashed px-10 py-14 text-center transition ${
          isDragOver
            ? 'border-accent bg-accent-soft dark:bg-accent/10'
            : 'border-line bg-surface dark:border-line-dark dark:bg-surface-dark'
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark">
          <UploadCloud size={26} />
        </div>
        <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">Drop your images here</h2>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">or choose files from your computer</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={handleSelectImages}
            className="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <ImagePlus size={16} />
            Select Images
          </button>
          <button
            onClick={handleSelectFolder}
            className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:hover:bg-canvas-dark"
          >
            <FolderOpen size={16} />
            Select Folder
          </button>
          <button
            onClick={handleImportZip}
            className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:hover:bg-canvas-dark"
          >
            <FileArchive size={16} />
            Import ZIP
          </button>
        </div>

        <p className="mt-6 text-xs text-muted dark:text-muted-dark">{SUPPORTED_LABEL}</p>
      </div>
      {notice && <p className="mt-4 text-sm text-muted dark:text-muted-dark">{notice}</p>}
    </div>
  );
}
