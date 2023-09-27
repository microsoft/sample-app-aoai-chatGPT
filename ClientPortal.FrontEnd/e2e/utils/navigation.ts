import { Page } from '@playwright/test'

function delay(time: number): Promise<'timeout'> {
  return new Promise(resolve => setTimeout(() => resolve('timeout'), time))
}

export async function tryNavigation(page: Page, url: string | RegExp, maxRetries: number) {
  const timeoutInMs = 5000
  for (let i = 0; i < maxRetries; i++) {
    const navigationPromise = page.waitForURL(url, { timeout: 10000 })
    const result = await Promise.race([navigationPromise, delay(timeoutInMs)])

    if (result !== 'timeout') {
      return
    }

    console.log(`Navigation took too long, retrying... [Attempt: ${i + 1}]`)
    const currentURL = page.url()
    await page.goto(currentURL)
  }

  throw new Error(`Max navigation retries reached while waiting for ${url}`)
}
