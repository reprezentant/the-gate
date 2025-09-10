import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Read host/port from environment with safe defaults
const host = process.env.VITE_HOST || '0.0.0.0'
const port = Number(process.env.VITE_PORT || 5173)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port,
  },
})
