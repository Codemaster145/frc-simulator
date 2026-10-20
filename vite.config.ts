import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/frc-simulator/' : '/',
  build: { target: 'es2022', chunkSizeWarningLimit: 2600 },
  worker: { format: 'es' },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'models/*', 'field/*'],
      manifest: {
        name: 'CyberCats · Team 2872',
        short_name: 'CyberCats',
        description: 'Interactive 3D showcase of FRC Team 2872’s robot.',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#060708',
        theme_color: '#060708',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything, including the model, so it works with zero Wi-Fi after the first open.
        globPatterns: ['**/*.{js,css,html,png,svg,glb,json,bin,wasm,webmanifest}'],
        maximumFileSizeToCacheInBytes: 64 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
}));
