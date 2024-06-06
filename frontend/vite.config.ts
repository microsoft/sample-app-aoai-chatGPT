import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    proxy: {
      '/ask': 'http://localhost:5000',
      '/chat': 'http://localhost:5000',
      '/history': 'http://127.0.0.1:50505',
      '/conversation': 'http://127.0.0.1:50505',
      '/frontend_settings': 'http://127.0.0.1:50505',
      '/v2/history': 'http://127.0.0.1:50505',
      '/v2/conversation': 'http://127.0.0.1:50505',
    }
  }
})
