import React, { useState } from 'react';
import { Trash2, CheckSquare, Square, X } from 'lucide-react';
import { useApp } from '@/stores/AppContext';
import { ImageQueueItemRow } from './ImageQueueItem';
import { PreviewModal } from './PreviewModal';

export function ImageQueue() {
  const { state, dispatch, retryImage } = useApp();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const allSelected = state.images.length > 0 && state.selectedIds.size === state.images.length;
  const previewImage = state.images.find((i) => i.id === previewId) ?? null;

  const handleClearAll = async () => {
    await window.api.clearQueue();
    dispatch({ type: 'CLEAR_QUEUE' });
    setConfirmClear(false);
  };

  const handleRemoveSelected = async () => {
    await Promise.all(Array.from(state.selectedIds).map((id) => window.api.removeImage(id)));
    dispatch({ type: 'REMOVE_SELECTED' });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3 dark:border-line-dark">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: allSelected ? 'DESELECT_ALL' : 'SELECT_ALL' })}
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
          >
            {allSelected ? <CheckSquare size={16} className="text-accent" /> : <Square size={16} />}
            Select all
          </button>
          {state.selectedIds.size > 0 && (
            <button
              onClick={handleRemoveSelected}
              className="flex items-center gap-1.5 text-sm font-medium text-danger transition hover:opacity-80"
            >
              <Trash2 size={15} />
              Remove selected ({state.selectedIds.size})
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-muted dark:text-muted-dark">
            {state.images.length} image{state.images.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={() => setConfirmClear(true)}
            className="text-sm font-medium text-muted transition hover:text-danger dark:text-muted-dark"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-line dark:divide-line-dark">
        {state.images.map((image) => (
          <ImageQueueItemRow
            key={image.id}
            image={image}
            selected={state.selectedIds.has(image.id)}
            onToggleSelect={() => dispatch({ type: 'TOGGLE_SELECT', id: image.id })}
            onRemove={async () => {
              await window.api.removeImage(image.id);
              dispatch({ type: 'REMOVE_IMAGE', id: image.id });
            }}
            onPreview={() => setPreviewId(image.id)}
            onRetry={() => retryImage(image.id)}
          />
        ))}
      </div>

      {previewImage && <PreviewModal image={previewImage} onClose={() => setPreviewId(null)} />}

      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-card bg-surface p-5 shadow-xl dark:bg-surface-dark">
            <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">
              Remove all {state.images.length} images?
            </h3>
            <p className="mt-1 text-sm text-muted dark:text-muted-dark">
              This clears the queue. Already-exported files on disk are not affected.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex items-center gap-1 rounded-card border border-line px-3 py-1.5 text-sm font-medium text-ink dark:border-line-dark dark:text-ink-dark"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="rounded-card bg-danger px-3 py-1.5 text-sm font-medium text-white"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
