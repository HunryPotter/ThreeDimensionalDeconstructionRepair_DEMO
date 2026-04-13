import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: './',
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100 * 1024 * 1024, // 100MB to ensure all prototype assets are inlined
  },
  server: {
    port: 3000,
    open: true
  }
});
