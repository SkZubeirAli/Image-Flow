import { useEffect } from 'react';
import { useApp } from '@/stores/AppContext';

export function useKeyboardShortcuts() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'o' && !e.shiftKey) {
        e.preventDefault();
        const images = await window.api.selectImages();
        if (images.length) dispatch({ type: 'ADD_IMAGES', images });
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        const images = await window.api.selectFolder();
        if (images.length) dispatch({ type: 'ADD_IMAGES', images });
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const completedIds = state.images.filter((i) => i.status === 'completed').map((i) => i.id);
        if (completedIds.length) await window.api.exportAll({ ids: completedIds, askOverwrite: state.appSettings.askBeforeOverwrite });
      } else if (mod && e.key.toLowerCase() === 'a') {
        const active = document.activeElement;
        const isTyping = active && ['INPUT', 'TEXTAREA'].includes(active.tagName);
        if (!isTyping) {
          e.preventDefault();
          dispatch({ type: 'SELECT_ALL' });
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement;
        const isTyping = active && ['INPUT', 'TEXTAREA'].includes(active.tagName);
        if (!isTyping && state.selectedIds.size > 0) {
          e.preventDefault();
          await Promise.all(Array.from(state.selectedIds).map((id) => window.api.removeImage(id)));
          dispatch({ type: 'REMOVE_SELECTED' });
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.images, state.selectedIds, state.appSettings, dispatch]);
}
