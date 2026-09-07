import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // LAN-reachable (10.0.0.18:5173)
    allowedHosts: true, // permit Cloudflare-tunnel hostnames (HTTPS access)
    proxy: {
      // Same-origin `/api` reverse proxy to the leads_to_conversion backend.
      // The backend serves routes at their root (`/settings`, `/leads`, …) and
      // sets an HttpOnly `access_token` cookie, so a same-origin proxy (not
      // cross-origin CORS) is required for cookie auth to work.
      '/api': {
        target: 'http://127.0.0.1:8870',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
