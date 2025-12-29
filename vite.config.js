import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        detail: resolve(__dirname, 'detail.html'),
        favorites: resolve(__dirname, 'favorites.html'),
        trending: resolve(__dirname, 'trending.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
