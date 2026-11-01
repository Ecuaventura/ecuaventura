import { defineConfig } from 'vite';

// base './' para que las rutas funcionen al cargar el juego desde archivo dentro de Electron
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000
  }
});
