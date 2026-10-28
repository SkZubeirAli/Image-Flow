import React from 'react';
import { Home, ListChecks, Settings2, Info } from 'lucide-react';
import { useApp } from '@/stores/AppContext';

const items = [
  { key: 'home', page: 'home', label: 'Home', icon: Home },
  { key: 'queue', page: 'home', label: 'Queue', icon: ListChecks },
  { key: 'settings', page: 'settings', label: 'Settings', icon: Settings2 },
  { key: 'about', page: 'about', label: 'About', icon: Info }
] as const;

export function Sidebar() {
  const { state, dispatch } = useApp();
  const queueCount = state.images.length;

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-line bg-surface p-3 dark:border-line-dark dark:bg-surface-dark">
      {items.map(({ key, page, label, icon: Icon }) => {
        const active = state.activePage === page;
        return (
          <button
            key={key}
            onClick={() => dispatch({ type: 'SET_PAGE', page })}
            className={`flex items-center justify-between rounded-card px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark'
                : 'text-muted hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-ink-dark'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon size={17} />
              {label}
            </span>
            {key === 'queue' && queueCount > 0 && (
              <span className="rounded-full bg-ink/5 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted dark:bg-white/10 dark:text-muted-dark">
                {queueCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
