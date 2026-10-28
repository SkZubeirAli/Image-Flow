import React from 'react';
import { Eye, X, RotateCw, Loader2, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { ImageItem } from '@/types';
import { formatBytes, formatDimensions, compressionPercent } from '@/utils/format';

interface Props {
  image: ImageItem;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onPreview: () => void;
  onRetry: () => void;
}

const statusConfig: Record<ImageItem['status'], { label: string; className: string; icon: React.ReactNode }> = {
  waiting: { label: 'Waiting', className: 'text-muted dark:text-muted-dark', icon: <Circle size={14} /> },
  processing: {
    label: 'Processing...',
    className: 'text-accent dark:text-accent-dark',
    icon: <Loader2 size={14} className="animate-spin" />
  },
  completed: { label: 'Completed', className: 'text-accent dark:text-accent-dark', icon: <CheckCircle2 size={14} /> },
  failed: { label: 'Failed', className: 'text-danger', icon: <AlertCircle size={14} /> },
  cancelled: { label: 'Cancelled', className: 'text-muted dark:text-muted-dark', icon: <Circle size={14} /> }
};

export function ImageQueueItemRow({ image, selected, onToggleSelect, onRemove, onPreview, onRetry }: Props) {
  const status = statusConfig[image.status];
  const pct = image.output ? compressionPercent(image.original.sizeBytes, image.output.sizeBytes) : null;

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-canvas/60 dark:hover:bg-canvas-dark/40">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        className="h-4 w-4 rounded border-line accent-accent dark:border-line-dark"
      />

      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-card bg-canvas dark:bg-canvas-dark">
        {image.thumbnailDataUrl && (
          <img src={image.thumbnailDataUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink dark:text-ink-dark">{image.fileName}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-xs tabular-nums text-muted dark:text-muted-dark">
          <span>{formatDimensions(image.original.width, image.original.height)}</span>
          <span>{formatBytes(image.original.sizeBytes)}</span>
          {image.output && (
            <>
              <span className="text-ink/40 dark:text-white/30">&rarr;</span>
              <span>{formatDimensions(image.output.width, image.output.height)}</span>
              <span>{formatBytes(image.output.sizeBytes)}</span>
              <span className="font-sans font-medium text-accent dark:text-accent-dark">{pct}% smaller</span>
            </>
          )}
        </div>
        {image.status === 'failed' && image.errorMessage && (
          <div className="mt-0.5 text-xs text-danger">{image.errorMessage}</div>
        )}
      </div>

      <div className={`flex w-32 shrink-0 items-center gap-1.5 text-xs font-medium ${status.className}`}>
        {status.icon}
        {status.label}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {image.status === 'failed' && (
          <button
            onClick={onRetry}
            aria-label="Retry"
            className="flex h-8 w-8 items-center justify-center rounded-card text-muted transition hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
          >
            <RotateCw size={15} />
          </button>
        )}
        <button
          onClick={onPreview}
          aria-label="Preview"
          className="flex h-8 w-8 items-center justify-center rounded-card text-muted transition hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
        >
          <Eye size={15} />
        </button>
        <button
          onClick={onRemove}
          aria-label="Remove"
          className="flex h-8 w-8 items-center justify-center rounded-card text-muted transition hover:bg-canvas hover:text-danger dark:text-muted-dark dark:hover:bg-canvas-dark"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
