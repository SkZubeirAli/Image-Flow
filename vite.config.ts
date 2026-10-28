import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Resolve the src directory for the @ alias
const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react()],

  resolve: {
    alias: {
      '@': srcPath
    }
  },

  root: '.',

  build: {
    outDir: 'dist',
    emptyOutDir: true
  },

  server: {
    port: 5173,
    strictPort: true
  }
});