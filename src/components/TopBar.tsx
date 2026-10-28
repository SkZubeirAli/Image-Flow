import React from 'react';
import { Moon, Sun, Settings2, Info, Layers } from 'lucide-react';
import { useApp } from '@/stores/AppContext';

export function TopBar() {
  const { state, dispatch } = useApp();

  const toggleTheme = () => {
    const next = state.appSettings.theme === 'dark' ? 'light' : 'dark';
    const settings = { ...state.appSettings, theme: next as 'light' | 'dark' };
    dispatch({ type: 'SET_APP_SETTINGS', settings });
    window.api.setSettings(settings);
  };

  const isDark = state.appSettings.theme === 'dark';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-6 dark:border-line-dark dark:bg-surface-dark">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-card bg-accent/10 text-accent">
          <Layers size={20} strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-ink dark:text-ink-dark">ImageFlow</div>
          <div className="text-xs text-muted dark:text-muted-dark">Bulk image resizer &amp; compressor</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-card text-muted transition hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'settings' })}
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-card text-muted transition hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
        >
          <Settings2 size={18} />
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'about' })}
          aria-label="About"
          className="flex h-9 w-9 items-center justify-center rounded-card text-muted transition hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
        >
          <Info size={18} />
        </button>
      </div>
    </header>
  );
}
