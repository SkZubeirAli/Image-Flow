import React from 'react';
import { useApp } from '@/stores/AppContext';
import { Dropzone } from '@/components/Dropzone';
import { ImageQueue } from '@/components/ImageQueue';
import { ProcessingSettingsPanel } from '@/components/ProcessingSettingsPanel';
import { ProgressBar } from '@/components/ProgressBar';
import { SummaryCard } from '@/components/SummaryCard';

export function Home() {
  const { state } = useApp();
  const isEmpty = state.images.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <Dropzone />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProgressBar />
        {state.summary && <SummaryCard />}
        <ImageQueue />
      </div>
      <ProcessingSettingsPanel />
    </div>
  );
}
