import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { formatBytes, formatDimensions, compressionPercent } from '@/utils/format';
import { ImageItem } from '@/types';

interface Props {
  image: ImageItem;
  onClose: () => void;
}

export function PreviewModal({ image, onClose }: Props) {
  const [preview, setPreview] = useState<{
    originalDataUrl: string;
    processedDataUrl: string | null;
  } | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    window.api.getPreview(image.id).then((res) => {
      if (res) setPreview({ originalDataUrl: res.originalDataUrl, processedDataUrl: res.processedDataUrl });
    });
  }, [image.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pct = image.output ? compressionPercent(image.original.sizeBytes, image.output.sizeBytes) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-4xl flex-col rounded-card bg-surface p-5 shadow-xl dark:bg-surface-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">{image.fileName}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              className="flex h-8 w-8 items-center justify-center rounded-card text-muted hover:bg-canvas dark:text-muted-dark dark:hover:bg-canvas-dark"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="flex h-8 w-8 items-center justify-center rounded-card text-muted hover:bg-canvas dark:text-muted-dark dark:hover:bg-canvas-dark"
              aria-label="Fit"
            >
              <Maximize size={16} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="flex h-8 w-8 items-center justify-center rounded-card text-muted hover:bg-canvas dark:text-muted-dark dark:hover:bg-canvas-dark"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <span className="mx-1 w-10 text-center font-mono text-xs tabular-nums text-muted dark:text-muted-dark">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={onClose}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-card text-muted hover:bg-canvas dark:text-muted-dark dark:hover:bg-canvas-dark"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-card">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {preview?.processedDataUrl ? (
              <BeforeAfterSlider originalSrc={preview.originalDataUrl} processedSrc={preview.processedDataUrl} />
            ) : preview ? (
              <img src={preview.originalDataUrl} className="w-full rounded-card object-contain" alt="Original" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted dark:text-muted-dark">
                Loading preview...
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted dark:text-muted-dark">Original</div>
            <div className="font-mono tabular-nums text-ink dark:text-ink-dark">
              {formatDimensions(image.original.width, image.original.height)}
            </div>
            <div className="font-mono tabular-nums text-muted dark:text-muted-dark">
              {formatBytes(image.original.sizeBytes)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted dark:text-muted-dark">Processed</div>
            <div className="font-mono tabular-nums text-ink dark:text-ink-dark">
              {image.output ? formatDimensions(image.output.width, image.output.height) : '--'}
            </div>
            <div className="font-mono tabular-nums text-muted dark:text-muted-dark">
              {image.output ? formatBytes(image.output.sizeBytes) : '--'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted dark:text-muted-dark">Compression</div>
            <div className="font-mono tabular-nums text-accent dark:text-accent-dark">
              {pct !== null ? `${pct}%` : '--'}
            </div>
            <div className="text-muted dark:text-muted-dark">
              Format: {image.output?.format?.toUpperCase() ?? '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
