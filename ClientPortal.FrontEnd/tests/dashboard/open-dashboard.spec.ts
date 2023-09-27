import { Page, expect, test } from '@playwright/test'
import personData from '../data/person.response.json'
import {
  mockLoggedInUser,
  mockPersonResponse,
  mockQuestionnairesResponse,
  setupBrowser,
  switchLanguage,
} from '../helpers/test-helpers'

let page: Page
test.beforeAll(async () => {
  page = await setupBrowser()
})

test('Given that we have a logged in user', async () => {
  await Promise.all([
    mockLoggedInUser(page),
    mockPersonResponse(page),
    mockQuestionnairesResponse(page),
  ])
})

test('When navigating to /dashboard with user credentials', async () => {
  await page.goto('/dashboard')
  expect(page).resolves
  await switchLanguage(page, 'Svenska')
})

test('Then we should see some user information', async () => {
  expect(page.getByText('Delidas Habanero', { exact: true }))
  await expect(page.getByRole('heading', { name: 'Välkommen' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mina formulär' })).toBeVisible()
  expect(page.getByText('Grundinformation'))
  expect(page.getByText('Kundkännedom'))
  expect(page.getByText('Behovsanalys/Passandeprövning'))
  expect(page.getByText('Mina kontaktuppgifter'))
  expect(page.getByText(personData.firstName))
  expect(page.getByText(personData.surName))
  expect(page.getByText(personData.phoneNumbers[0].number))
})
