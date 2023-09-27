import { expect, test } from '@playwright/test'
import { configureSnapshotPath } from '../playwright.snapshot.config'
import { tryNavigation } from './utils/navigation'

test.beforeEach(configureSnapshotPath())

test('should login', async ({ page }) => {
  test.setTimeout(120000)
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Welcome to Carnegie' })).toBeVisible({
    timeout: 30000,
  })
  await page.getByRole('button', { name: /Login/i }).click()
  await tryNavigation(page, /identity-dev/i, 10)
  await page.getByRole('link', { name: /Dev login/i }).click()
  await page.getByLabel('Username').click()
  await page.getByRole('textbox', { name: 'Username' }).fill('189906019808')

  const responsePromise = page.waitForResponse('**/oauth-agent/login/end', { timeout: 30000 })
  await page.getByRole('button', { name: 'Next' }).click()

  expect((await responsePromise).ok())
  await tryNavigation(page, '**/dashboard', 10)

  await expect(page.getByText('Welcome')).toBeVisible({ timeout: 30000 })
})
