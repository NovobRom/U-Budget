import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Додали favicon.png у кеш
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'U-Budget',
        short_name: 'U-Budget',
        description: 'Manage your family budget simply',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  
  // КРИТИЧНО: ЗБЕРІГАЄМО ТВОЇ НАЛАШТУВАННЯ
  envPrefix: 'REACT_APP_', 
  
  server: {
    port: 5173,
    // host: true, 
  },
  
  build: {
    // Встановлення цільової збірки для забезпечення сумісності
    target: 'es2020' 
  }
});