import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Load proxy target from environment variables, defaulting to local localhost backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/dashboard': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/product': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/cart': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/wishlist': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/address': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/order': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

