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

let kycResponse: any
let page: Page
test.beforeAll(async () => {
  page = await setupBrowser()
})

test('Given a logged in user viewing the first page of the KYC', async () => {
  await Promise.all([
    mockLoggedInUser(page),
    mockPersonResponse(page),
    mockQuestionnairesResponse(page, 'Customer', [
      { type: 'kyc', status: QuestionnaireStatus.Pending },
    ]),
  ])

  kycResponse = await mockKycQuestionnaireResponse(page)
  await page.goto('/questionnaires/trapets?id=1&reference=ExternalPhysicalDepot&mode=edit')
  expect(page).resolves
  await switchLanguage(page, 'Svenska')
  await expect(page.getByRole('heading', { name: 'Kundkännedom' })).toBeVisible()
})

test('When not filling in values, it should prevent us from advancing to the next page', async () => {
  await expect(page.getByText('2 / 7')).toBeVisible()
  await page.getByRole('button', { name: 'Nästa' }).click()
  await expect(page.getByText('2 / 7')).toBeVisible()
})

test('Then with valid values, we should be able to submit the entire KYC and be redirected to /dashboard', async () => {
  await page.getByText('Kortsiktigt sparande (mindre än 5 år)').click()
  await page.getByLabel('Nej').click()
  const { totalPages } = kycResponse.default.pageDefinition.navigation
  await page.getByRole('button', { name: 'Nästa' }).click()
  let { currentPage } = kycResponse.default.pageDefinition.navigation
  while (currentPage < totalPages) {
    const nextPage = await mockKycQuestionnaireResponse(page, currentPage)
    currentPage = nextPage.default.pageDefinition.navigation.currentPage
    await page.getByRole('button', { name: 'Nästa' }).click()

    if (currentPage < totalPages) {
      await expect(
        page.getByText(`${currentPage} / ${totalPages}`),
        `Error on page ${currentPage}`,
      ).toBeVisible()
    }

    for (const subNodes of nextPage.default.pageDefinition.rootNode.subNodes) {
      if (subNodes.text) {
        await expect(page.getByText(subNodes.text)).toBeVisible()
      }
    }
  }

  await expect(page.getByText('Tack för dina svar')).toBeVisible()
  expect(page).resolves
  await new Promise(resolve => setTimeout(resolve, 1000))
  await expect(page.getByRole('heading', { name: 'Välkommen' })).toBeVisible({timeout: 10000})
  expect(page.url()).toContain('/dashboard')
})
