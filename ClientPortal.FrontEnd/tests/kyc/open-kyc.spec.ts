import { Page, expect, test } from '@playwright/test'
import { QuestionnaireStatus } from '../../src/enums/QuestionnaireStatus'
import {
  mockKycQuestionnaireResponse,
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

test('Given a logged in user with a KYC to complete', async () => {
  await Promise.all([
    mockLoggedInUser(page),
    mockPersonResponse(page),
    mockQuestionnairesResponse(page, 'Customer', [
      { type: 'kyc', status: QuestionnaireStatus.Pending },
    ]),
  ])
})

test('When we see navigate to /dashboard and open the KYC', async () => {
  await page.goto('/dashboard')
  expect(page).resolves
  await switchLanguage(page, 'Svenska')
  await expect(page.getByText('Välkommen')).toBeVisible()
})

test('Then navigating to the KYC we should see some information', async () => {
  const response = await mockKycQuestionnaireResponse(page)
  await page.getByRole('button', { name: /Kundkännedom/i }).click()
  await expect(page.getByRole('heading', { name: 'Kundkännedom' })).toBeVisible()
  for (const subNodes of response.default.pageDefinition.rootNode.subNodes) {
    if (subNodes?.text) {
      await expect(page.getByText(subNodes.text)).toBeVisible()
    }
  }
})
