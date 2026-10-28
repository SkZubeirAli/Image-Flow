import { contextBridge, ipcRenderer } from 'electron';

// Nothing from Node (fs, child_process, require) is ever exposed here.
// Only narrow, purpose-built functions cross the context-isolation boundary.

const api = {
  selectImages: () => ipcRenderer.invoke('dialog:selectImages'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  importZip: () => ipcRenderer.invoke('dialog:importZip'),

  removeImage: (id: string) => ipcRenderer.invoke('queue:remove', id),
  clearQueue: () => ipcRenderer.invoke('queue:clear'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: unknown) => ipcRenderer.invoke('settings:set', settings),

  startProcessing: (payload: { ids: string[]; settings: unknown; maxConcurrent: number }) =>
    ipcRenderer.invoke('process:start', payload),
  cancelProcessing: () => ipcRenderer.invoke('process:cancel'),
  retryImage: (payload: { id: string; settings: unknown }) => ipcRenderer.invoke('process:retry', payload),

  getPreview: (id: string) => ipcRenderer.invoke('preview:get', id),

  selectExportFolder: () => ipcRenderer.invoke('export:selectFolder'),
  exportOne: (payload: { id: string; askOverwrite: boolean }) => ipcRenderer.invoke('export:saveOne', payload),
  exportAll: (payload: { ids: string[]; askOverwrite: boolean }) => ipcRenderer.invoke('export:all', payload),
  exportZip: (payload: { ids: string[] }) => ipcRenderer.invoke('export:zip', payload),
  openFolder: (folderPath: string) => ipcRenderer.invoke('export:openFolder', folderPath),

  onProgress: (cb: (progress: any) => void) => {
    const listener = (_e: unknown, data: any) => cb(data);
    ipcRenderer.on('process:progress', listener);
    return () => ipcRenderer.removeListener('process:progress', listener);
  },
  onImageUpdate: (cb: (update: any) => void) => {
    const listener = (_e: unknown, data: any) => cb(data);
    ipcRenderer.on('image:update', listener);
    return () => ipcRenderer.removeListener('image:update', listener);
  },
  onExportProgress: (cb: (data: any) => void) => {
    const listener = (_e: unknown, data: any) => cb(data);
    ipcRenderer.on('export:progress', listener);
    return () => ipcRenderer.removeListener('export:progress', listener);
  }
};

contextBridge.exposeInMainWorld('api', api);

export type ImageFlowApi = typeof api;
