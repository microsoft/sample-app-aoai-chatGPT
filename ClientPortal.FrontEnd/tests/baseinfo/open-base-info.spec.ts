import { Page, expect, test } from '@playwright/test'
import { QuestionnaireStatus } from '../../src/enums/QuestionnaireStatus'
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

test('Given we have a loggedIn user with a baseinfo form to complete', async () => {
  await Promise.all([
    mockLoggedInUser(page),
    mockPersonResponse(page),
    mockQuestionnairesResponse(page, 'Customer', [
      { type: 'base', status: QuestionnaireStatus.Pending },
    ]),
  ])
})

test('When navigating to /dashboard and clicking the form', async () => {
  await page.goto('/dashboard')
  expect(page).resolves
  await switchLanguage(page, 'Svenska')
  await page.getByRole('button', { name: /Grundinformation/i }).click()
})

test('Then the base info questionnnaire should open', async () => {
  await expect(page.getByRole('heading', { name: 'Grundinformation' })).toBeVisible()
  expect(page.url()).toContain('/questionnaires/base-info?mode=edit')
})
