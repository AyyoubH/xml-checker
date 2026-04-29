import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['xmllint-wasm', 'xmllint-wasm/index-browser.mjs'],
  },
});
