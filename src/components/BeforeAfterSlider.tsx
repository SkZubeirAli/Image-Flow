import React, { useCallback, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  originalSrc: string;
  processedSrc: string;
  originalLabel?: string;
  processedLabel?: string;
}

export function BeforeAfterSlider({
  originalSrc,
  processedSrc,
  originalLabel = 'ORIGINAL',
  processedLabel = 'PROCESSED'
}: Props) {
  const [position, setPosition] = useState(50); // percent from left
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    updateFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2));
    if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2));
    if (e.key === 'Home') setPosition(0);
    if (e.key === 'End') setPosition(100);
  };

  return (
    <div className="select-none">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-black/5"
      >
        <img
          src={originalSrc}
          alt="Original"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-0 h-full overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={processedSrc}
            alt="Processed"
            className="h-full w-full object-contain"
            style={{ width: containerRef.current?.clientWidth ?? '100%', maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white">
          {processedLabel}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white">
          {originalLabel}
        </span>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparison position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={onKeyDown}
          className="absolute top-0 h-full w-0.5 cursor-ew-resize bg-white shadow focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
            <div className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-ink/40" />
          </div>
        </div>
      </div>
      <button
        onClick={() => setPosition(50)}
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
      >
        <RotateCcw size={13} />
        Reset slider
      </button>
    </div>
  );
}
