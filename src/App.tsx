import React from 'react';
import { AppProvider, useApp } from '@/stores/AppContext';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { Home } from '@/pages/Home';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function Shell() {
  const { state } = useApp();
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 overflow-hidden">
          {state.activePage === 'home' && <Home />}
          {state.activePage === 'settings' && <SettingsPage />}
          {state.activePage === 'about' && <AboutPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
