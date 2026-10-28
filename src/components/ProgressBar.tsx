import React from 'react';
import { useApp } from '@/stores/AppContext';
import { formatEta } from '@/utils/format';

export function ProgressBar() {
  const { state, cancelProcessing } = useApp();
  const { progress } = state;
  if (!progress.isProcessing && progress.total === 0) return null;

  const percent = progress.total > 0 ? Math.round(((progress.completed + progress.failed) / progress.total) * 100) : 0;

  return (
    <div className="border-b border-line bg-surface px-5 py-3 dark:border-line-dark dark:bg-surface-dark">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink dark:text-ink-dark">
          {progress.isProcessing ? 'Processing images...' : 'Processing complete'}
        </span>
        <span className="font-mono tabular-nums text-muted dark:text-muted-dark">
          {progress.completed + progress.failed} / {progress.total}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas dark:bg-canvas-dark">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted dark:text-muted-dark">
        <span>
          {progress.isProcessing && progress.currentFileName
            ? `Current: ${progress.currentFileName} \u2014 ${progress.currentStatusLabel}`
            : progress.currentStatusLabel}
        </span>
        <div className="flex items-center gap-3">
          {progress.isProcessing && <span>ETA: {formatEta(progress.etaSeconds)}</span>}
          {progress.isProcessing && (
            <button onClick={cancelProcessing} className="font-medium text-danger hover:opacity-80">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
