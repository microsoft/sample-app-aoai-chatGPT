import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('')
})

test('should redirect to login', async ({ page }) => {
  await page.waitForURL('/login')
  await expect(page.getByRole('heading', { name: 'Welcome to Carnegie' })).toBeVisible({
    timeout: 20000,
  })
})

test('should change language', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Welcome to Carnegie' })).toBeVisible({
    timeout: 20000,
  })
  await page.getByRole('button', { name: 'user-profile' }).click()
  await page.getByRole('menuitem', { name: 'Svenska' }).getByText('Svenska').click()
  await expect(
    page.getByRole('heading', { name: 'Tack för att du håller din kundinformation uppdaterad' }),
  ).toBeVisible()
})
