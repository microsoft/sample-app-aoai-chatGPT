import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePluginRadar } from 'vite-plugin-radar'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePluginRadar({
      gtm: [
        {
          id: 'GTM-WVGSLXKF', // Replace with your GTM container ID
          //gtmBase: 'https://www.custom.com/gtm.js', // Optional: Custom GTM script URL
          //nsBase: 'https://www.custom.com/ns.html', // Optional: Custom no-script URL
        },
      ],
    }),
  ],
  build: {
    outDir: '../static',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    proxy: {
      '/ask': 'http://localhost:5000',
      '/chat': 'http://localhost:5000'
    }
  }
})

