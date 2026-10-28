import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import {
  ImageItem,
  ProcessingSettings,
  AppSettings,
  OverallProgress,
  ProcessingSummary
} from '@/types';

export const DEFAULT_PROCESSING_SETTINGS: ProcessingSettings = {
  resize: {
    mode: 'width',
    width: 1920,
    height: 1080,
    percentage: 100,
    maintainAspectRatio: true,
    fit: 'fit'
  },
  compression: {
    mode: 'quality',
    quality: 80,
    targetSize: 500,
    targetUnit: 'KB',
    allowFormatConversionForTarget: true
  },
  format: {
    output: 'original',
    jpegQuality: 80,
    webpQuality: 80,
    pngCompressionLevel: 6,
    backgroundColor: 'white',
    customBackgroundHex: '#FFFFFF'
  },
  rename: {
    mode: 'keep',
    replaceWith: '',
    prefix: '',
    suffix: '',
    sequenceStart: 1,
    sequencePadding: 3,
    findText: '',
    replaceText: ''
  },
  metadata: {
    preserveMetadata: true
  }
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  defaultOutputFormat: 'original',
  defaultQuality: 80,
  maintainAspectRatioDefault: true,
  maxConcurrent: 3,
  preserveMetadataDefault: true,
  askBeforeOverwrite: true,
  outputFolderName: 'ImageFlow_Output'
};

const EMPTY_PROGRESS: OverallProgress = {
  total: 0,
  completed: 0,
  failed: 0,
  currentFileName: null,
  currentStatusLabel: '',
  isProcessing: false,
  startedAt: null,
  etaSeconds: null
};

interface State {
  images: ImageItem[];
  selectedIds: Set<string>;
  processingSettings: ProcessingSettings;
  appSettings: AppSettings;
  progress: OverallProgress;
  summary: ProcessingSummary | null;
  activePage: 'home' | 'settings' | 'about';
}

type Action =
  | { type: 'ADD_IMAGES'; images: ImageItem[] }
  | { type: 'REMOVE_IMAGE'; id: string }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'TOGGLE_SELECT'; id: string }
  | { type: 'SELECT_ALL' }
  | { type: 'DESELECT_ALL' }
  | { type: 'REMOVE_SELECTED' }
  | { type: 'UPDATE_PROCESSING_SETTINGS'; settings: Partial<ProcessingSettings> }
  | { type: 'SET_APP_SETTINGS'; settings: AppSettings }
  | { type: 'IMAGE_UPDATE'; update: Partial<ImageItem> & { id: string } }
  | { type: 'SET_PROGRESS'; progress: OverallProgress }
  | { type: 'SET_SUMMARY'; summary: ProcessingSummary | null }
  | { type: 'RESET_STATUSES' }
  | { type: 'SET_PAGE'; page: State['activePage'] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_IMAGES':
      return { ...state, images: [...state.images, ...action.images] };
    case 'REMOVE_IMAGE': {
      const selectedIds = new Set(state.selectedIds);
      selectedIds.delete(action.id);
      return { ...state, images: state.images.filter((i) => i.id !== action.id), selectedIds };
    }
    case 'CLEAR_QUEUE':
      return { ...state, images: [], selectedIds: new Set(), summary: null, progress: EMPTY_PROGRESS };
    case 'TOGGLE_SELECT': {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(action.id)) selectedIds.delete(action.id);
      else selectedIds.add(action.id);
      return { ...state, selectedIds };
    }
    case 'SELECT_ALL':
      return { ...state, selectedIds: new Set(state.images.map((i) => i.id)) };
    case 'DESELECT_ALL':
      return { ...state, selectedIds: new Set() };
    case 'REMOVE_SELECTED':
      return {
        ...state,
        images: state.images.filter((i) => !state.selectedIds.has(i.id)),
        selectedIds: new Set()
      };
    case 'UPDATE_PROCESSING_SETTINGS':
      return { ...state, processingSettings: { ...state.processingSettings, ...action.settings } };
    case 'SET_APP_SETTINGS':
      return { ...state, appSettings: action.settings };
    case 'IMAGE_UPDATE':
      return {
        ...state,
        images: state.images.map((img) => (img.id === action.update.id ? { ...img, ...action.update } : img))
      };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'SET_SUMMARY':
      return { ...state, summary: action.summary };
    case 'RESET_STATUSES':
      return {
        ...state,
        images: state.images.map((img) => ({ ...img, status: 'waiting', output: undefined, errorMessage: undefined }))
      };
    case 'SET_PAGE':
      return { ...state, activePage: action.page };
    default:
      return state;
  }
}

interface AppContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  startProcessing: () => Promise<void>;
  cancelProcessing: () => Promise<void>;
  retryImage: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    images: [],
    selectedIds: new Set<string>(),
    processingSettings: DEFAULT_PROCESSING_SETTINGS,
    appSettings: DEFAULT_APP_SETTINGS,
    progress: EMPTY_PROGRESS,
    summary: null,
    activePage: 'home'
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    window.api.getSettings().then((s) => dispatch({ type: 'SET_APP_SETTINGS', settings: s }));
  }, []);

  useEffect(() => {
    const offProgress = window.api.onProgress((progress) => dispatch({ type: 'SET_PROGRESS', progress }));
    const offImage = window.api.onImageUpdate((update) => dispatch({ type: 'IMAGE_UPDATE', update: update as any }));
    return () => {
      offProgress();
      offImage();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const theme = state.appSettings.theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
  }, [state.appSettings.theme]);

  const startProcessing = useCallback(async () => {
    const current = stateRef.current;
    const ids = current.images.map((i) => i.id);
    if (ids.length === 0) return;
    dispatch({ type: 'RESET_STATUSES' });
    dispatch({ type: 'SET_SUMMARY', summary: null });
    const originalTotalBytes = current.images.reduce((sum, i) => sum + i.original.sizeBytes, 0);

    await window.api.startProcessing({
      ids,
      settings: current.processingSettings,
      maxConcurrent: current.appSettings.maxConcurrent
    });

    const finalImages = stateRef.current.images;
    const outputTotalBytes = finalImages.reduce((sum, i) => sum + (i.output?.sizeBytes ?? 0), 0);
    const failedCount = finalImages.filter((i) => i.status === 'failed').length;
    dispatch({
      type: 'SET_SUMMARY',
      summary: {
        totalImages: finalImages.length,
        originalTotalBytes,
        outputTotalBytes,
        failedCount
      }
    });
  }, []);

  const cancelProcessing = useCallback(async () => {
    await window.api.cancelProcessing();
  }, []);

  const retryImage = useCallback(async (id: string) => {
    await window.api.retryImage({ id, settings: stateRef.current.processingSettings });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, startProcessing, cancelProcessing, retryImage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
