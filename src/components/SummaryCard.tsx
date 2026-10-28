import React, { useState } from 'react';
import { CheckCircle2, FolderOutput, FileArchive, FolderOpen } from 'lucide-react';
import { useApp } from '@/stores/AppContext';
import { formatBytes, compressionPercent } from '@/utils/format';

export function SummaryCard() {
  const { state } = useApp();
  const { summary } = state;
  const [busy, setBusy] = useState<'folder' | 'zip' | null>(null);
  const [lastExportPath, setLastExportPath] = useState<string | null>(null);

  if (!summary) return null;

  const completedIds = state.images.filter((i) => i.status === 'completed').map((i) => i.id);
  const spaceSaved = summary.originalTotalBytes - summary.outputTotalBytes;
  const avgReduction = compressionPercent(summary.originalTotalBytes, summary.outputTotalBytes);

  const handleExportAll = async () => {
    setBusy('folder');
    const folder = await window.api.exportAll({ ids: completedIds, askOverwrite: state.appSettings.askBeforeOverwrite });
    setBusy(null);
    if (folder) setLastExportPath(folder);
  };

  const handleExportZip = async () => {
    setBusy('zip');
    const zipPath = await window.api.exportZip({ ids: completedIds });
    setBusy(null);
    if (zipPath) setLastExportPath(zipPath);
  };

  return (
    <div className="mx-5 mt-4 rounded-card border border-line bg-surface p-5 dark:border-line-dark dark:bg-surface-dark">
      <div className="flex items-center gap-2 text-accent dark:text-accent-dark">
        <CheckCircle2 size={18} />
        <span className="text-sm font-semibold uppercase tracking-wide">Processing complete</span>
      </div>
      <p className="mt-1 text-sm text-muted dark:text-muted-dark">
        {summary.totalImages} image{summary.totalImages === 1 ? '' : 's'} processed
        {summary.failedCount > 0 ? `, ${summary.failedCount} failed` : ''}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <Stat label="Original size" value={formatBytes(summary.originalTotalBytes)} />
        <Stat label="Output size" value={formatBytes(summary.outputTotalBytes)} />
        <Stat label="Space saved" value={formatBytes(spaceSaved)} accent />
        <Stat label="Avg. reduction" value={`${avgReduction}%`} accent />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={handleExportAll}
          disabled={busy !== null || completedIds.length === 0}
          className="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <FolderOutput size={16} />
          {busy === 'folder' ? 'Exporting...' : 'Export All'}
        </button>
        <button
          onClick={handleExportZip}
          disabled={busy !== null || completedIds.length === 0}
          className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-50 dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:hover:bg-canvas-dark"
        >
          <FileArchive size={16} />
          {busy === 'zip' ? 'Creating ZIP...' : 'Export as ZIP'}
        </button>
        {lastExportPath && (
          <button
            onClick={() => window.api.openFolder(lastExportPath)}
            className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:hover:bg-canvas-dark"
          >
            <FolderOpen size={16} />
            Open Folder
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted dark:text-muted-dark">{label}</div>
      <div
        className={`font-mono text-lg tabular-nums ${
          accent ? 'text-accent dark:text-accent-dark' : 'text-ink dark:text-ink-dark'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
