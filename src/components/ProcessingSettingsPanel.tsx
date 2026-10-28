import React from 'react';
import { useApp, DEFAULT_PROCESSING_SETTINGS } from '@/stores/AppContext';
import {
  ResizeMode,
  FitMode,
  CompressionMode,
  OutputFormat,
  RenameMode,
  BackgroundColor
} from '@/types';
import { Play, Loader2 } from 'lucide-react';

const PRESETS: Array<{ label: string; width: number; height: number }> = [
  { label: 'Instagram Square', width: 1080, height: 1080 },
  { label: 'Instagram Portrait', width: 1080, height: 1350 },
  { label: 'Full HD', width: 1920, height: 1080 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720 },
  { label: 'Website', width: 1600, height: 900 }
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-4 last:border-b-0 dark:border-line-dark">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Radio<T extends string>({
  value,
  current,
  onChange,
  label
}: {
  value: T;
  current: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink dark:text-ink-dark">
      <input
        type="radio"
        checked={current === value}
        onChange={() => onChange(value)}
        className="h-3.5 w-3.5 accent-accent"
      />
      {label}
    </label>
  );
}

export function ProcessingSettingsPanel() {
  const { state, dispatch, startProcessing } = useApp();
  const { processingSettings: s, progress, images } = state;

  const setResize = (patch: Partial<typeof s.resize>) =>
    dispatch({ type: 'UPDATE_PROCESSING_SETTINGS', settings: { resize: { ...s.resize, ...patch } } });
  const setCompression = (patch: Partial<typeof s.compression>) =>
    dispatch({ type: 'UPDATE_PROCESSING_SETTINGS', settings: { compression: { ...s.compression, ...patch } } });
  const setFormat = (patch: Partial<typeof s.format>) =>
    dispatch({ type: 'UPDATE_PROCESSING_SETTINGS', settings: { format: { ...s.format, ...patch } } });
  const setRename = (patch: Partial<typeof s.rename>) =>
    dispatch({ type: 'UPDATE_PROCESSING_SETTINGS', settings: { rename: { ...s.rename, ...patch } } });
  const setMetadata = (patch: Partial<typeof s.metadata>) =>
    dispatch({ type: 'UPDATE_PROCESSING_SETTINGS', settings: { metadata: { ...s.metadata, ...patch } } });

  const hasTransparencyRisk = s.format.output === 'jpeg' && images.some((i) => i.original.hasAlpha);
  const isPngLosslessTargetWarning =
    s.compression.mode === 'targetSize' &&
    s.format.output === 'png' &&
    !s.compression.allowFormatConversionForTarget;

  const disabled = progress.isProcessing || images.length === 0;

  return (
    <aside className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-l border-line bg-surface dark:border-line-dark dark:bg-surface-dark">
      <Section title="Resize">
        <div className="space-y-0.5">
          <Radio value="original" current={s.resize.mode} onChange={(v: ResizeMode) => setResize({ mode: v })} label="Keep original size" />
          <Radio value="width" current={s.resize.mode} onChange={(v: ResizeMode) => setResize({ mode: v })} label="By width" />
          <Radio value="height" current={s.resize.mode} onChange={(v: ResizeMode) => setResize({ mode: v })} label="By height" />
          <Radio value="exact" current={s.resize.mode} onChange={(v: ResizeMode) => setResize({ mode: v })} label="Exact dimensions" />
          <Radio value="percentage" current={s.resize.mode} onChange={(v: ResizeMode) => setResize({ mode: v })} label="Percentage" />
        </div>

        {s.resize.mode !== 'original' && s.resize.mode !== 'percentage' && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted dark:text-muted-dark">Width</label>
              <input
                type="number"
                value={s.resize.width}
                onChange={(e) => setResize({ width: Number(e.target.value) })}
                disabled={s.resize.mode === 'height'}
                className="mt-0.5 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink disabled:opacity-40 dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted dark:text-muted-dark">Height</label>
              <input
                type="number"
                value={s.resize.height}
                onChange={(e) => setResize({ height: Number(e.target.value) })}
                disabled={s.resize.mode === 'width'}
                className="mt-0.5 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink disabled:opacity-40 dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
              />
            </div>
          </div>
        )}

        {s.resize.mode === 'percentage' && (
          <div className="mt-2">
            <label className="text-xs text-muted dark:text-muted-dark">Percentage of original</label>
            <input
              type="number"
              value={s.resize.percentage}
              onChange={(e) => setResize({ percentage: Number(e.target.value) })}
              className="mt-0.5 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
            />
          </div>
        )}

        {(s.resize.mode === 'width' || s.resize.mode === 'height') && (
          <label className="mt-2 flex items-center gap-2 text-xs text-ink dark:text-ink-dark">
            <input
              type="checkbox"
              checked={s.resize.maintainAspectRatio}
              onChange={(e) => setResize({ maintainAspectRatio: e.target.checked })}
              className="h-3.5 w-3.5 accent-accent"
            />
            Maintain aspect ratio
          </label>
        )}

        {s.resize.mode === 'exact' && (
          <div className="mt-3">
            <label className="text-xs text-muted dark:text-muted-dark">Fit mode</label>
            <div className="mt-1 flex gap-1.5">
              {(['fit', 'fill', 'stretch'] as FitMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setResize({ fit: m })}
                  className={`flex-1 rounded-card border px-2 py-1.5 text-xs font-medium capitalize transition ${
                    s.resize.fit === m
                      ? 'border-accent bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark'
                      : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <label className="text-xs text-muted dark:text-muted-dark">Presets</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setResize({ mode: 'exact', width: p.width, height: p.height })}
                className="rounded-card border border-line px-2 py-1 text-xs text-muted transition hover:border-accent hover:text-accent dark:border-line-dark dark:text-muted-dark"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Compression">
        <div className="space-y-0.5">
          <Radio
            value="quality"
            current={s.compression.mode}
            onChange={(v: CompressionMode) => setCompression({ mode: v })}
            label="Quality-based"
          />
          <Radio
            value="targetSize"
            current={s.compression.mode}
            onChange={(v: CompressionMode) => setCompression({ mode: v })}
            label="Target file size"
          />
        </div>

        {s.compression.mode === 'quality' ? (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted dark:text-muted-dark">
              <span>Quality</span>
              <span className="font-mono tabular-nums">{s.compression.quality}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={s.compression.quality}
              onChange={(e) => setCompression({ quality: Number(e.target.value) })}
              className="mt-1 w-full accent-accent"
            />
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={s.compression.targetSize}
                onChange={(e) => setCompression({ targetSize: Number(e.target.value) })}
                className="w-24 rounded-card border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
              />
              <select
                value={s.compression.targetUnit}
                onChange={(e) => setCompression({ targetUnit: e.target.value as 'KB' | 'MB' })}
                className="rounded-card border border-line bg-canvas px-2 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
              >
                <option value="KB">KB</option>
                <option value="MB">MB</option>
              </select>
              <div className="flex flex-wrap gap-1">
                {[100, 500, 1024, 2048].map((kb) => (
                  <button
                    key={kb}
                    onClick={() =>
                      setCompression(
                        kb >= 1024 ? { targetSize: kb / 1024, targetUnit: 'MB' } : { targetSize: kb, targetUnit: 'KB' }
                      )
                    }
                    className="rounded-card border border-line px-2 py-1 text-xs text-muted hover:border-accent hover:text-accent dark:border-line-dark dark:text-muted-dark"
                  >
                    {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs text-ink dark:text-ink-dark">
              <input
                type="checkbox"
                checked={s.compression.allowFormatConversionForTarget}
                onChange={(e) => setCompression({ allowFormatConversionForTarget: e.target.checked })}
                className="mt-0.5 h-3.5 w-3.5 accent-accent"
              />
              Allow format conversion if needed
            </label>
            <p className="text-xs text-muted dark:text-muted-dark">
              An exact file size can't always be guaranteed &mdash; encoding depends on image content.
              {isPngLosslessTargetWarning &&
                ' PNG is lossless; enable format conversion above to reliably hit a target size.'}
            </p>
          </div>
        )}
      </Section>

      <Section title="Output format">
        <select
          value={s.format.output}
          onChange={(e) => setFormat({ output: e.target.value as OutputFormat })}
          className="w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
        >
          <option value="original">Original</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WEBP</option>
          <option value="avif">AVIF</option>
        </select>

        {s.format.output === 'png' && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted dark:text-muted-dark">
              <span>PNG compression level</span>
              <span className="font-mono tabular-nums">{s.format.pngCompressionLevel}</span>
            </div>
            <input
              type="range"
              min={0}
              max={9}
              value={s.format.pngCompressionLevel}
              onChange={(e) => setFormat({ pngCompressionLevel: Number(e.target.value) })}
              className="mt-1 w-full accent-accent"
            />
          </div>
        )}

        {hasTransparencyRisk && (
          <div className="mt-2 rounded-card bg-warn/10 px-3 py-2 text-xs text-warn">
            JPEG does not support transparency. Transparent areas will be converted to the background color below.
          </div>
        )}

        {s.format.output === 'jpeg' && (
          <div className="mt-2">
            <label className="text-xs text-muted dark:text-muted-dark">Background color</label>
            <div className="mt-1 flex gap-1.5">
              {(['white', 'black', 'custom'] as BackgroundColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setFormat({ backgroundColor: c })}
                  className={`flex-1 rounded-card border px-2 py-1.5 text-xs font-medium capitalize transition ${
                    s.format.backgroundColor === c
                      ? 'border-accent bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark'
                      : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {s.format.backgroundColor === 'custom' && (
              <input
                type="color"
                value={s.format.customBackgroundHex}
                onChange={(e) => setFormat({ customBackgroundHex: e.target.value })}
                className="mt-2 h-8 w-full rounded-card border border-line dark:border-line-dark"
              />
            )}
          </div>
        )}
      </Section>

      <Section title="Rename">
        <div className="space-y-0.5">
          <Radio value="keep" current={s.rename.mode} onChange={(v: RenameMode) => setRename({ mode: v })} label="Keep original name" />
          <Radio value="replace" current={s.rename.mode} onChange={(v: RenameMode) => setRename({ mode: v })} label="Replace name" />
          <Radio value="prefix" current={s.rename.mode} onChange={(v: RenameMode) => setRename({ mode: v })} label="Add prefix" />
          <Radio value="suffix" current={s.rename.mode} onChange={(v: RenameMode) => setRename({ mode: v })} label="Add suffix" />
          <Radio value="sequence" current={s.rename.mode} onChange={(v: RenameMode) => setRename({ mode: v })} label="Number sequence" />
        </div>

        {s.rename.mode === 'replace' && (
          <input
            value={s.rename.replaceWith}
            onChange={(e) => setRename({ replaceWith: e.target.value })}
            placeholder="new-name"
            className="mt-2 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
          />
        )}
        {s.rename.mode === 'prefix' && (
          <input
            value={s.rename.prefix}
            onChange={(e) => setRename({ prefix: e.target.value })}
            placeholder="portfolio_"
            className="mt-2 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
          />
        )}
        {s.rename.mode === 'suffix' && (
          <input
            value={s.rename.suffix}
            onChange={(e) => setRename({ suffix: e.target.value })}
            placeholder="_compressed"
            className="mt-2 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
          />
        )}
        {s.rename.mode === 'sequence' && (
          <div className="mt-2 flex gap-2">
            <input
              value={s.rename.replaceWith}
              onChange={(e) => setRename({ replaceWith: e.target.value })}
              placeholder="portfolio_"
              className="flex-1 rounded-card border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
            />
            <input
              type="number"
              value={s.rename.sequenceStart}
              onChange={(e) => setRename({ sequenceStart: Number(e.target.value) })}
              className="w-20 rounded-card border border-line bg-canvas px-2.5 py-1.5 font-mono text-sm tabular-nums text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
              title="Starting number"
            />
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted dark:text-muted-dark">Find</label>
            <input
              value={s.rename.findText}
              onChange={(e) => setRename({ findText: e.target.value })}
              placeholder="IMG_"
              className="mt-0.5 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
            />
          </div>
          <div>
            <label className="text-xs text-muted dark:text-muted-dark">Replace</label>
            <input
              value={s.rename.replaceText}
              onChange={(e) => setRename({ replaceText: e.target.value })}
              placeholder="Product_"
              className="mt-0.5 w-full rounded-card border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark"
            />
          </div>
        </div>
      </Section>

      <Section title="Metadata">
        <label className="flex items-center gap-2 text-sm text-ink dark:text-ink-dark">
          <input
            type="checkbox"
            checked={s.metadata.preserveMetadata}
            onChange={(e) => setMetadata({ preserveMetadata: e.target.checked })}
            className="h-3.5 w-3.5 accent-accent"
          />
          Preserve metadata
        </label>
        {!s.metadata.preserveMetadata && (
          <p className="mt-1 text-xs text-muted dark:text-muted-dark">
            EXIF and GPS information will be stripped from processed images.
          </p>
        )}
      </Section>

      <div className="sticky bottom-0 border-t border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark">
        <button
          onClick={() => {
            if (!progress.isProcessing) startProcessing();
          }}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {progress.isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play size={16} />
              Process {images.length || ''} Image{images.length === 1 ? '' : 's'}
            </>
          )}
        </button>
        <button
          onClick={() => dispatch({ type: 'UPDATE_PROCESSING_SETTINGS', settings: DEFAULT_PROCESSING_SETTINGS })}
          className="mt-2 w-full text-center text-xs font-medium text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
        >
          Reset to defaults
        </button>
      </div>
    </aside>
  );
}
