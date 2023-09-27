import { Page, expect, test } from '@playwright/test'
import personData from '../data/person.response.json'
import {
  mockBaseInfoResponse,
  mockLoggedInUser,
  mockPersonResponse,
  setupBrowser,
  switchLanguage,
} from '../helpers/test-helpers'

let page: Page
test.beforeAll(async () => {
  page = await setupBrowser()
})

test("Given that we're viewing the base form overview page", async () => {
  await Promise.all([mockLoggedInUser(page), mockPersonResponse(page)])

  const baseFormEditModeUrl = '/questionnaires/base-info?mode=edit'
  await page.goto(baseFormEditModeUrl)
  expect(page.url()).toContain(baseFormEditModeUrl)
  await switchLanguage(page, 'Svenska')
  await expect(page.locator('form').getByText(personData.name)).toBeVisible()
  await expect(page.getByText(personData.identifications[0].identifier)).toBeVisible()
  await expect(page.getByText(personData.addresses[0].address1)).toBeVisible()
  await expect(
    page.getByText(`${personData.addresses[0].postalCode} ${personData.addresses[0].city}`),
  ).toBeVisible()
})

test('When submitting the form WITHOUT supplying valid information we should show an error', async () => {
  await page.getByRole('button', { name: 'Nästa' }).click()
  await expect(page.getByText('Medborgarskap och skattehemvist')).toBeVisible()
  const [citizenship, taxCountry] = await Promise.all([
    page.locator('#citizenships'),
    page.locator('#primary_tax_country'),
  ])
  expect(await citizenship?.inputValue()).toEqual(personData.citizenships[0].name)
  expect(await taxCountry?.inputValue()).toEqual(personData.primaryTaxCountry.name)
  await mockBaseInfoResponse(page, 400)
  await page.getByRole('button', { name: 'Godkänn' }).click()

  const errorBannerText = page.getByText(
    'Formuläret saknar gilitiga uppgifterSe över dina svar nedan och försök igen',
  )
  const errorText = page.getByText('Du måste bekräfta att läst igenom och förstått våra villkor.')
  await expect(errorBannerText).toBeVisible()
  await expect(errorText).toBeVisible()
})

test('Then we submit WITH valid values we should be redirected back to /dashboard', async () => {
  await page
    .getByLabel(
      'Genom att fortsätta intygar du på heder och samvete att ovan uppgifter är riktiga och fullständiga samt förbinder att underrätta och uppdatera om någon av uppgifterna skulle ändras. Ett uppdaterande ska vara Carnegie tillhanda senast inom 30 dagar efter att uppgiften ändrats.',
    )
    .click()
  const errorText = page.getByText('Du måste bekräfta att läst igenom och förstått våra villkor.')
  expect(errorText).toBeHidden()
  await mockBaseInfoResponse(page, 204)
  await page.getByRole('button', { name: 'Godkänn' }).click()
  await expect(page.getByText('Tack för dina svar')).toBeVisible()
  await page.waitForURL('**/dashboard', { waitUntil: 'domcontentloaded', timeout: 5000 })
  await expect(page.getByRole('heading', { name: 'Välkommen' })).toBeVisible()
  expect(page.url()).toContain('/dashboard')
})
