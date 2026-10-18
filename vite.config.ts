import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'bayu-blades-logo-v3.svg', 'bayu-blades-logo-v3.png'],
      manifest: {
        name: 'Synchro9 Athlete Portal',
        short_name: 'Synchro9',
        description: 'Smart Attendance and Assessment Portal for Bayu Blades Synchro9 Team',
        theme_color: '#0a1e3f',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'bayu-blades-logo-v3.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'bayu-blades-logo-v3.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Caches only shell and assets, does NOT cache live athlete data
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']
      }
    })
  ]
});
