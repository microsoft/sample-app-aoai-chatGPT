import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  css: {
    devSourcemap: true, // helps track CSS HMR issues
  },
  server: {
    watch: {
      usePolling: true, // ensures CSS file updates trigger reloads (especially in Docker/WSL)
      interval: 100, // check every 100ms
    },
    proxy: {
      '/ask': 'http://localhost:5000',
      '/chat': 'http://localhost:5000',
    },
  },
  build: {
    outDir: '../static',
    emptyOutDir: true,
    sourcemap: true,
  },
})
