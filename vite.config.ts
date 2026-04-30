import { defineConfig } from 'vite';

export default defineConfig({
  base: '/xml-checker/',
  optimizeDeps: {
    exclude: ['xmllint-wasm', 'xmllint-wasm/index-browser.mjs'],
  },
});
