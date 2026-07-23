import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed port in dev
  server: { port: 1420, strictPort: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 4000 }
})
