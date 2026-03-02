import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME } from './backurl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },

      manifest: {
        name: `${APP_NAME} Rutas PWA`,
        short_name: 'RutasPWA',
        description: `App de rutas de ${APP_NAME} hecha con vue`,
        // CAMBIO: Usamos el color de tu marca para una mejor apariencia
        theme_color: '#28a745',
        // AÑADIDO: Un color de fondo para la pantalla de carga
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png' // Correcto
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png' // <-- CORRECCIÓN: Era 'types'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        // ELIMINADO: El bloque 'resolve' estaba aquí incorrectamente
      }
    })
  ],
  // El bloque 'resolve' debe estar aquí, a nivel principal
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true, // Mantenemos el --host implícito para pruebas en red
    proxy: {
      '/nominatim':{
        target: 'https://nominatim.openstreetmap.org', 
        changeOrigin: true, 
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
         headers: {
          'User-Agent': `RutasPWA-${APP_NAME}/1.0 (maxkss37j@gmail.com)`
        }
      }
    }
  }
})