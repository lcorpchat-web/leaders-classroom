import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Imports absolus depuis src : import { Button } from '@/components/ui/Button'
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Comme Nginx en production (figure 13) : /api est relayé vers l'API, même origine que le site
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
