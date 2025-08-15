// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  base: '/targetx-interactive-2/',
  build: {
    assetsInlineLimit: 0, // Disable inlining assets
  },
  plugins: [
    react(),
    svgr(),
    copy({
      targets: [{ src: 'src/assets', dest: 'assets' }],
      hook: 'writeBundle',
    }),
  ],
});
