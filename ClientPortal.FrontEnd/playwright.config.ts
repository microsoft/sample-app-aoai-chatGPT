import { defineConfig } from '@playwright/test'

export default defineConfig({
  use: {
    baseURL: process.env.PORTAL_URL ?? 'http://localhost:5173/',
  },
})
