import React from 'react';
import { useApp } from '@/stores/AppContext';
import { AppSettings, OutputFormat, ThemeMode } from '@/types';

function Row({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-4 last:border-b-0 dark:border-line-dark">
      <div>
        <div className="text-sm font-medium text-ink dark:text-ink-dark">{label}</div>
        {help && <div className="mt-0.5 text-xs text-muted dark:text-muted-dark">{help}</div>}
      </div>
      {children}
    </div>
  );
}

function selectClass() {
  return 'rounded-card border border-line bg-canvas px-3 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark';
}

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const s = state.appSettings;

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...s, ...patch };
    dispatch({ type: 'SET_APP_SETTINGS', settings: next });
    window.api.setSettings(next);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-lg font-semibold text-ink dark:text-ink-dark">Settings</h1>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">
          Defaults applied to new sessions. Per-batch overrides live in the processing panel.
        </p>

        <div className="mt-6 rounded-card border border-line bg-surface px-5 dark:border-line-dark dark:bg-surface-dark">
          <Row label="Theme">
            <select value={s.theme} onChange={(e) => update({ theme: e.target.value as ThemeMode })} className={selectClass()}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </Row>

          <Row label="Default output format">
            <select
              value={s.defaultOutputFormat}
              onChange={(e) => update({ defaultOutputFormat: e.target.value as OutputFormat })}
              className={selectClass()}
            >
              <option value="original">Original</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
            </select>
          </Row>

          <Row label="Default quality">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={s.defaultQuality}
                onChange={(e) => update({ defaultQuality: Number(e.target.value) })}
                className="accent-accent"
              />
              <span className="w-10 text-right font-mono text-sm tabular-nums text-ink dark:text-ink-dark">
                {s.defaultQuality}%
              </span>
            </div>
          </Row>

          <Row label="Maintain aspect ratio by default">
            <input
              type="checkbox"
              checked={s.maintainAspectRatioDefault}
              onChange={(e) => update({ maintainAspectRatioDefault: e.target.checked })}
              className="h-4 w-4 accent-accent"
            />
          </Row>

          <Row label="Maximum concurrent processing" help="Higher values use more CPU and memory.">
            <select
              value={s.maxConcurrent}
              onChange={(e) => update({ maxConcurrent: Number(e.target.value) })}
              className={selectClass()}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Preserve metadata">
            <input
              type="checkbox"
              checked={s.preserveMetadataDefault}
              onChange={(e) => update({ preserveMetadataDefault: e.target.checked })}
              className="h-4 w-4 accent-accent"
            />
          </Row>

          <Row label="Ask before overwriting" help="When off, exports will silently overwrite same-name files.">
            <input
              type="checkbox"
              checked={s.askBeforeOverwrite}
              onChange={(e) => update({ askBeforeOverwrite: e.target.checked })}
              className="h-4 w-4 accent-accent"
            />
          </Row>

          <Row label="Output folder name" help="Used when exporting alongside originals.">
            <input
              value={s.outputFolderName}
              onChange={(e) => update({ outputFolderName: e.target.value })}
              className="w-44 rounded-card border border-line bg-canvas px-3 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
            />
          </Row>
        </div>
      </div>
    </div>
  );
}
