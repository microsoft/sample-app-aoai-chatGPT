import { UseQueryResult } from '@tanstack/react-query'
import { Mock, vi } from 'vitest'
import { QuestionnaireItemOrigin, QuestionnaireStatus } from '../../enums'
import { CarnegieTokenResponse } from '../../types/bff/carnegie-token'
import { QuestionnaireItem } from '../../types/questionnaire-list'
import { getQuestionnaireItemNavigation } from './get-questionnaire-item-navigation'

let navigate: Mock
let questionnaireItem: QuestionnaireItem = {
  id: 0,
  name: 'base_info',
  origin: QuestionnaireItemOrigin.Carnegie,
  reference: null,
  status: QuestionnaireStatus.Pending,
  sortOrder: 1,
}
const token: UseQueryResult<CarnegieTokenResponse, Error> = null as any

describe('getQuestionnaireItemNavigation', () => {
  beforeEach(() => {
    navigate = vi.fn()
  })

  describe('item name base info', () => {
    beforeEach(() => {
      questionnaireItem.name = 'base_info'
      getQuestionnaireItemNavigation(questionnaireItem, 123, token, navigate)
    })

    test('should navigate to base info page', () => {
      expect(navigate).toHaveBeenCalledWith('/questionnaires/base-info?mode=edit')
    })
  })

  describe('item name account', () => {
    beforeEach(() => {
      questionnaireItem.name = 'account'
      getQuestionnaireItemNavigation(questionnaireItem, 123, token, navigate)
    })

    test('should navigate to account page', () => {
      expect(navigate).toHaveBeenCalledWith('/questionnaires/account?mode=edit')
    })
  })
})
