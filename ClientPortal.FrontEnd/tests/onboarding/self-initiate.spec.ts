import { Page, expect, test } from '@playwright/test'
import { QuestionnaireStatus } from '../../src/enums/QuestionnaireStatus'
import {
  mockCarnegieAuthResponse,
  mockNotInitiatedUser,
  mockOAuthEndResponse,
  mockOAuthRefresh,
  mockPersonResponse,
  mockQuestionnairesResponse,
  mockSelfOnboardingNewResponse,
  mockUserInfoResponse,
  setupBrowser,
  switchLanguage,
} from '../helpers/test-helpers'

let page: Page
test.beforeAll(async () => {
  page = await setupBrowser()
})

test('Given that we have a user that can be onboarded', async () => {
  await page.goto('/new-customer')
  expect(page.url()).toContain('/new-customer')
  await mockNotInitiatedUser(page)
  await switchLanguage(page, 'Svenska')
})

test('When we login, we are initiated', async () => {
  await page.getByRole('button', { name: 'Identifiera dig med BankID' }).click()
  await mockSelfOnboardingNewResponse(page)
  await expect(page.getByRole('heading', { name: 'Välkommen till oss' })).toBeVisible()
})

test('Then we login again and find ourself on /dashboard, we see some information', async () => {
  await mockOAuthRefresh(page)
  await mockUserInfoResponse(page, 'Prospect')
  await mockOAuthEndResponse(page, 'Prospect')
  await mockPersonResponse(page, { phoneNumbers: [], emails: [] })
  await mockQuestionnairesResponse(page, 'Prospect', [
    {
      type: 'base',
      status: QuestionnaireStatus.Pending,
    },
    {
      type: 'kyc',
      status: QuestionnaireStatus.PreCreation,
    },
    {
      type: 'account',
      status: QuestionnaireStatus.PreCreation,
    },
  ])
  await mockCarnegieAuthResponse(page)
  await page.getByRole('button', { name: 'Gå vidare' }).click()
  await expect(page.getByRole('heading', { name: 'Välkommen' })).toBeVisible()
  await expect(page.getByText('Tack för att du tar dig tid att svara på frågor')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Mina kontaktuppgifter Saknas Saknas' }),
  ).toBeVisible()
  expect(page.url()).toContain('/dashboard')
  await expect(
    page.getByRole('button', { name: '1 Medborgarskap och skattehemvist Grundinformation' }),
  ).toBeVisible()
  await expect(page.getByText('2Frågor om dig som kundKundkännedom')).toBeVisible()
  await expect(page.getByText('3Kontoavtal för nykundAvtal och kontoinformation')).toBeVisible()
})
