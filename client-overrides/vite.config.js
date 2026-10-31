// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }, // shadcn alias
  server: {
    port: 5173,
    proxy: {
      // Browser talks to :5173 only, so no CORS in dev
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',      // custom SW (src/sw.js) so we control the offline fallback
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['offline.html', 'icon.svg'],
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'] },
      manifest: {
        name: 'BrightSync',
        short_name: 'BrightSync',
        description: 'Offline-capable subscription management',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: true, type: 'module' },  // test the SW under `npm run dev`
    }),
  ],
});
