import { UseQueryResult } from '@tanstack/react-query'
import { NavigateFunction } from 'react-router'
import { QuestionnaireItemOrigin, QuestionnaireMode, QuestionnaireStatus } from '../../enums'
import { CarnegieTokenResponse } from '../../types/bff/carnegie-token'
import { QuestionnaireItem } from '../../types/questionnaire-list'

const switchCarnegieOrigin = (item: QuestionnaireItem): string => {
  switch (item.name) {
    case 'base_info':
      return `/questionnaires/base-info?mode=${QuestionnaireMode.Edit}`
    case 'account':
      return `/questionnaires/account?mode=${QuestionnaireMode.Edit}`
    default:
      return '/'
  }
}

const switchClientInformationOrigin = (
  item: QuestionnaireItem,
  personId: number,
  token: UseQueryResult<CarnegieTokenResponse, Error>,
  navigate: NavigateFunction,
): void => {
  if (!token.data) {
    return
  }

  switch (item.status) {
    case QuestionnaireStatus.Pending:
      return openBehPapTab(
        `edit/${item.id}`,
        new Date(token?.data?.expiry),
        token.data.token,
        navigate,
      )
      break
    case QuestionnaireStatus.Done:
      return openBehPapTab(
        `view/${item.id}`,
        new Date(token?.data?.expiry),
        token.data.token,
        navigate,
      )
      break
    case QuestionnaireStatus.UpdateRequired:
      return openBehPapTab(
        `new/${personId}/${item.reference}`,
        new Date(token?.data?.expiry),
        token.data.token,
        navigate,
      )
      break
  }
}

export const getQuestionnaireItemNavigation = (
  item: QuestionnaireItem,
  personId: number,
  token: UseQueryResult<CarnegieTokenResponse, Error>,
  navigate: NavigateFunction,
): void => {
  const mode =
    item.status === QuestionnaireStatus.Pending ? QuestionnaireMode.Edit : QuestionnaireMode.View

  switch (item.origin) {
    case QuestionnaireItemOrigin.Carnegie:
      return navigate(switchCarnegieOrigin(item))

    case QuestionnaireItemOrigin.Trapets:
      return navigate(
        `/questionnaires/trapets?id=${item.id}&reference=${item.reference}&mode=${mode}`,
      )

    case QuestionnaireItemOrigin.ClientInformation: {
      return switchClientInformationOrigin(item, personId, token, navigate)
    }

    default:
      throw new Error('Unknown questionnaire origin')
  }
}

const openBehPapTab = (
  callbackUrl: string,
  expiration: Date,
  token: string,
  navigate: NavigateFunction,
): void => {
  const url = `${window.ENV?.CUSTOMER_INFO_URL}/#!/init?callbackUrl=${encodeURI(
    callbackUrl,
  )}&expire=${expiration.toISOString()}&token=${token}&random=${new Date().getTime()}`
  window.open(url, '_blank', 'noreferrer')
  navigate('/')
}
