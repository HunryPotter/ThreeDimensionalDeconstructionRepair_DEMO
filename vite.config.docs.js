import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: './',
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: {
        docs: './docs.html'
      },
      output: {
        entryFileNames: 'docs.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    emptyOutDir: false // Prevent deleting dist/index.html from the main build
  }
});
