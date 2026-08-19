import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        chip: path.resolve(__dirname, 'src/renderer/chip/index.html'),
        display: path.resolve(__dirname, 'src/renderer/display/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
