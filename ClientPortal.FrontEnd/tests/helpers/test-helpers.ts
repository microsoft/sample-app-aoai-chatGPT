import { test } from '@playwright/test'
import { Page, chromium } from 'playwright-core'
import { QuestionnaireStatus } from '../../src/enums/QuestionnaireStatus'
import personData from '../data/person.response.json'
import QuestionnairesData from '../data/questionnaires.response.json'
import userInfoData from '../data/userinfo.response.json'

const CUSTOMER_ID = userInfoData.id

type UserType = 'Prospect' | 'Employee' | 'Customer' | 'None'
type FormType = 'base' | 'kyc' | 'account' | 'behpap'

export const setupBrowser = async (): Promise<Page> => {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  return page
}

export const mockOAuthStartResponse = async (browser: Page) => {
  await browser.route(`*/**/oauth-agent/login/start`, async route => {
    await route.fulfill({
      status: 302,
      headers: {
        Location: '/dashboard',
      },
    })
  })
}

export const mockOAuthEndResponse = async (browser: Page, userType: UserType = 'Customer') => {
  await browser.route(`*/**/oauth-agent/login/end`, async route => {
    const json = { handled: false, isLoggedIn: false, csrf: '' }
    if (userType === 'Customer') {
      json.isLoggedIn = true
      json.csrf = 'token'
    }

    if (userType === 'Prospect') {
      json.isLoggedIn = true
      json.csrf = 'token'
      json.handled = true
    }

    if (userType === 'None') {
      json.handled = true
      json.csrf = 'token'
      json.isLoggedIn = true
    }

    await route.fulfill({ json, status: 200 })
  })
}

export const mockOAuthRefresh = async (browser: Page) => {
  await browser.route(`*/**/oauth-agent/refresh`, async route => {
    await route.fulfill({
      status: 204,
      headers: {
        'Set-Cookie': 'curity-at=attoken; curity-auth=authtoken;',
      },
    })
  })
}

export const mockUserInfoResponse = async (browser: Page, userType: UserType = 'Customer') => {
  await browser.route(`*/**/userinfo`, async route => {
    const json = userInfoData
    if (userType === 'Customer') {
      json.isCustomer = true
      json.hasDashboardAccess = true
    }

    if (userType === 'Prospect') {
      json.isProspect = true
      json.hasDashboardAccess = true
    }

    if (userType === 'None') {
      await route.fulfill({
        status: 403,
        json: {
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.3',
          title: 'Forbidden',
          status: 403,
          detail: ' HttpStatusCode:Forbidden',
        },
      })
      return
    }

    await route.fulfill({ json, status: 200 })
  })
}

export const mockPersonResponse = async (browser: Page, data?: Partial<typeof personData>) => {
  await browser.route(`*/**/persons/${CUSTOMER_ID}`, async route => {
    await route.fulfill({ json: Object.assign(personData, data), status: 200 })
  })
}

export const mockSelfOnboardingNewResponse = async (browser: Page) => {
  await browser.route(`*/**/selfonboarding/new`, async route => {
    await route.fulfill({ status: 200, json: { success: true } })
  })
}

export const mockQuestionnairesResponse = async (
  browser: Page,
  userType?: UserType,
  customStatus?: { type: FormType; status: QuestionnaireStatus }[],
) => {
  const json = QuestionnairesData

  if (customStatus) {
    for (const { type, status } of customStatus) {
      json.questionnaires.map(form =>
        form.id === getFormIdByName(type) ? (form.status = status) : form,
      )
    }
  }

  if (userType === 'Prospect') {
    json.questionnaires.push({
      id: 3,
      name: 'account',
      origin: 'Carnegie',
      status: QuestionnaireStatus.PreCreation,
      sortOrder: 4,
    })
    // Prospects don't have behpap
    json.questionnaires = json.questionnaires.filter(form => form.name !== 'behpap')
  }

  await browser.route(`*/**/questionnaires/${CUSTOMER_ID}`, async route => {
    await route.fulfill({ json, status: 200 })
  })
}

export const mockKycQuestionnaireResponse = async (browser: Page, page = 1) => {
  const json = await import(`../data/kycform/kycform${page}.response.json`)

  if (page > 1) {
    await browser.route(`*/**/questionnaires/next`, async route => {
      return await route.fulfill({ json, status: 200 })
    })
  } else {
    const formId = getFormIdByName('kyc')
    await browser.route(
      `*/**/customers/${CUSTOMER_ID}/questionnaires/${formId}/start?reference=ExternalPhysicalDepot`,
      async route => {
        return await route.fulfill({ json, status: 200 })
      },
    )
  }

  return json
}

export const mockContactDetailsRequest = async (
  browser: Page,
  email: string | undefined,
  phoneNumber: string | undefined,
) => {
  await browser.route(`*/**/persons/${CUSTOMER_ID}/contact-details`, async route => {
    await route.fulfill({
      status: 200,
      json: { email, phoneNumber },
    })
  })
}

export const mockCarnegieAuthResponse = async (browser: Page) => {
  await browser.route(`*/**/token/carnegie`, async route => {
    await route.fulfill({
      status: 200,
      json: {
        token: 'jabbadabbadooo',
        expiry: '2099-09-14T00:53:45.3632217Z',
      },
    })
  })
}

export const mockBaseInfoResponse = async (browser: Page, status: 204 | 400 = 204) => {
  await browser.route(`*/**/persons/${CUSTOMER_ID}/base-info`, async route => {
    if (status === 400) {
      return route.fulfill({
        status,
        json: {
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
          title: 'One or more validation errors occurred.',
          status,
          errors: {
            Confirmation: ['REQUIRED'],
          },
        },
      })
    }

    route.fulfill({ status })
  })
}

export const switchLanguage = async (page: Page, lang: 'Svenska' | 'English' = 'Svenska') => {
  await page.getByRole('button', { name: 'user-profile' }).click()
  await page.getByRole('menuitem', { name: lang }).locator('div').click()
}

export const pauseForDebugging = () => {
  test.afterEach(async (_, testInfo) => {
    const notPassed = testInfo.status !== 'passed'
    const hasError = testInfo.error !== undefined

    const keepOpen = notPassed || hasError

    console.log(...testInfo.errors.map(e => e.stack))

    if (keepOpen) {
      console.error('*** Error: keeping browser open for debugging. ***')
      testInfo.setTimeout(0)
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await new Promise(() => {}) // Never resolves
    }
  })
}

const getFormIdByName = (formType: FormType) =>
  ({
    base: 0,
    kyc: 1,
    behpap: 2,
    account: 3,
  }[formType])

export const mockLoggedInUser = async (browser: Page) => {
  await mockOAuthEndResponse(browser)
  await mockUserInfoResponse(browser)
  await mockOAuthRefresh(browser)
  await mockCarnegieAuthResponse(browser)
}

export const mockNotInitiatedUser = async (browser: Page) => {
  await mockUserInfoResponse(browser, 'None')
  await mockOAuthStartResponse(browser)
  await mockOAuthEndResponse(browser, 'None')
  await mockUserInfoResponse(browser, 'None')
  await mockOAuthRefresh(browser)
}
