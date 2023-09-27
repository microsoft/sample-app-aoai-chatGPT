import { Page, expect, test } from '@playwright/test'
import personData from '../data/person.response.json'
import {
  mockContactDetailsRequest,
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

test('Given a logged in user on /dashboard viewing the contact details drawer', async () => {
  await Promise.all([
    mockLoggedInUser(page),
    mockPersonResponse(page),
    mockQuestionnairesResponse(page),
  ])
  await page.goto('/dashboard')
  await switchLanguage(page)
  await page.click('#contactDetailsCard')
})

test('When we submit incorrect information we get an HTML-validation error preventing us from submitting', async () => {
  const [phoneNr, email] = await Promise.all([page.$('#phoneNumber'), page.$('#email')])
  const [newPhone, newEmail] = ['0707', 'newemail@.com']

  expect((await phoneNr?.inputValue())?.toString()).toEqual(personData.phoneNumbers[0].number)
  expect(await email?.inputValue()).toEqual(personData.emails[0].email)
  await phoneNr?.fill(newPhone)
  await email?.fill(newEmail)
  await mockContactDetailsRequest(page, newPhone, newEmail)
  await page.getByRole('button', { name: 'Spara' }).click()
  const phoneNrValidity = await phoneNr?.evaluate((input: HTMLInputElement) => input.validity.valid)
  const emailValidity = await email?.evaluate((input: HTMLInputElement) => input.validity.valid)
  expect(phoneNrValidity).toEqual(false)
  expect(emailValidity).toEqual(false)
  await expect(page.getByRole('button', { name: 'Spara' })).toBeVisible()
})

test('Then we fill in correct information we are allowed to submit and the drawer closes', async () => {
  const [phoneNr, email] = await Promise.all([page.$('#phoneNumber'), page.$('#email')])
  const [newPhoneNr, newEmail] = ['07071337', 'newemail@address.com']
  await phoneNr?.fill(newPhoneNr)
  await email?.fill(newEmail)
  const phoneNrValidity = await phoneNr?.evaluate((input: HTMLInputElement) => input.validity.valid)
  const emailValidity = await email?.evaluate((input: HTMLInputElement) => input.validity.valid)
  expect(phoneNrValidity).toEqual(true)
  expect(emailValidity).toEqual(true)
  await mockContactDetailsRequest(page, newPhoneNr, newEmail)
  await page.getByRole('button', { name: 'Spara' }).click()
  await expect(page.getByRole('button', { name: 'Spara' })).toBeHidden()
})
