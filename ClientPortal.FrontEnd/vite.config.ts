/// <reference types="vitest" />

import NodeGlobalsPolyFill from '@esbuild-plugins/node-globals-polyfill'
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { configDefaults } from 'vitest/config'

// https://vitejs.dev/config/
// https://github.com/vitejs/awesome-vite#plugins

export default defineConfig({
  build: {
    manifest: true,
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    viteStaticCopy({
      targets: [
        {
          src: './node_modules/@carnegie/duplo/public/fonts/*',
          dest: 'fonts',
        },
      ],
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyFill({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
  resolve: {
    alias: {
      process: 'process/browser',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'vitest.setup.ts',
    reporters: ['verbose', 'vitest-sonar-reporter'],
    outputFile: {
      'vitest-sonar-reporter': 'coverage/test-reporter.xml',
    },
    coverage: {
      reporter: ['text', 'lcov'],
    },
    exclude: [...configDefaults.exclude, 'e2e', 'tests'],
  },
})
