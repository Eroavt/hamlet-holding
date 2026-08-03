import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
// @ts-expect-error — plain ESM helper, no types needed for a dev-only plugin
import { capturePlugin } from './scripts/vite-plugin-capture.mjs';

export default defineConfig({
  // Absolute root. Division URLs (/project-development, …) are real paths via
  // the History API — a relative base would resolve the built JS/CSS against
  // that deep path instead of the site root the moment someone opens or
  // refreshes a division link directly, which is a blank page in production.
  base: '/',
  plugins: [capturePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 2048,
    cssCodeSplit: false,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // three is the heavy one — keep it in its own long-cacheable chunk
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
});
