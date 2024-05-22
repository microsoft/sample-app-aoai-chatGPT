/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: ['src/api'],
        include: ['src']
      },
      environment: 'jsdom',
      globals: true,
      setupFiles: './setupTests.ts',
      onConsoleLog(log: string, type: 'stdout' | 'stderr'): false | void {
        console.log('log in test: ', log)
        if (log === 'message from third party library' && type === 'stdout') {
          return false
        }
      }
    }
  })
)
