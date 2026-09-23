import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      mode === 'https' ? basicSsl() : null,
      react(),
      tailwindcss(),
      VitePWA({
        includeAssets: ['apple-touch-icon-180x180.png', 'favicon.ico', 'favicon.svg'],
        manifest: {
          background_color: '#f8f6f0',
          categories: ['business', 'social'],
          description: 'Encontre trabalhos e contrate profissionais perto de você.',
          display: 'standalone',
          id: '/',
          icons: [
            {
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              purpose: 'any',
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              purpose: 'maskable',
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
          lang: 'pt-BR',
          name: 'TrampoFácil',
          scope: '/',
          short_name: 'TrampoFácil',
          start_url: '/',
          theme_color: '#0b6b61',
        },
        registerType: 'prompt',
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          globPatterns: ['**/*.{css,html,js,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api(?:\/|$)/],
          runtimeCaching: [
            {
              handler: 'NetworkOnly',
              method: 'GET',
              urlPattern: ({ request }) => request.destination === '',
            },
          ],
          skipWaiting: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: environment.API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: environment.API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          url: 'http://localhost:3000',
        },
      },
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
