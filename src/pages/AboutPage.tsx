import React from 'react';
import { Layers, ShieldCheck, HardDrive, Zap } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-card bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark">
          <Layers size={24} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink dark:text-ink-dark">ImageFlow</h1>
        <p className="text-sm text-muted dark:text-muted-dark">Version 1.0.0 &middot; Bulk Image Resizer &amp; Compressor</p>

        <div className="mt-6 space-y-3">
          <Feature icon={<ShieldCheck size={16} />} title="Runs fully offline">
            Every image is read, resized, compressed, and saved on this computer. Nothing is uploaded anywhere.
          </Feature>
          <Feature icon={<HardDrive size={16} />} title="No account, no cloud">
            No login, no server, no database. Your photos never leave your machine.
          </Feature>
          <Feature icon={<Zap size={16} />} title="Built for batches">
            Handles 50, 100, or more images at once with configurable concurrency and streaming-friendly processing.
          </Feature>
        </div>

        <p className="mt-8 text-xs text-muted dark:text-muted-dark">
          Built with Electron, React, TypeScript, and Sharp.
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-card border border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark">
      <div className="mt-0.5 text-accent dark:text-accent-dark">{icon}</div>
      <div>
        <div className="text-sm font-medium text-ink dark:text-ink-dark">{title}</div>
        <div className="mt-0.5 text-sm text-muted dark:text-muted-dark">{children}</div>
      </div>
    </div>
  );
}
