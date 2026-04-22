import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../../sidepanel-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, 'index.html') },
    },
  },
  // In production build we emit to extension/sidepanel/ (static)
  base: './',
});
