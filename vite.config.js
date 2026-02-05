import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script-defer',
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
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                cleanupOutdatedCaches: true, // Offline mode fix
                clientsClaim: true, // Offline mode fix
                skipWaiting: true, // Offline mode fix
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'firebase-data-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 86400, // 24h
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'google-fonts-cache',
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxAgeSeconds: 31536000, // 1 year
                            },
                        },
                    },
                ],
            },
        }),
        visualizer({
            open: false,
            filename: 'stats.html',
            gzipSize: true,
            brotliSize: true,
        }),
    ],

    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
    },

    envPrefix: 'REACT_APP_',

    server: {
        port: 5173,
        proxy: {
            '/monobank': {
                target: 'https://api.monobank.ua',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/monobank/, '/api'),
            },
        },
    },

    build: {
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (
                        id.includes('node_modules/react') ||
                        id.includes('node_modules/react-dom')
                    ) {
                        return 'vendor-react';
                    }
                    if (
                        id.includes('node_modules/firebase') ||
                        id.includes('node_modules/@firebase')
                    ) {
                        return 'vendor-firebase';
                    }
                    if (id.includes('node_modules/recharts')) {
                        return 'vendor-recharts';
                    }
                },
            },
        },
    },
});
