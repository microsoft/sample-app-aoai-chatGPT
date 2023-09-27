import { UseQueryResult } from '@tanstack/react-query'
import { TFunction } from 'i18next'
import { NavigateFunction } from 'react-router'
import { FormListItemProps } from '../../components/form-list/FormListItem'
import { CarnegieTokenResponse } from '../../types/bff/carnegie-token'
import { QuestionnaireItem } from '../../types/questionnaire-list'
import { getQuestionnaireItemNavigation } from './get-questionnaire-item-navigation'

export type QuestionnaireForm = Pick<
  QuestionnaireItem,
  'name' | 'origin' | 'reference' | 'status' | 'sortOrder'
> &
  Pick<FormListItemProps, 'label' | 'title' | 'onClick'>

export const mapQuestionnairesToForms = (
  t: TFunction<'questionnaires'>,
  navigate: NavigateFunction,
  personId: number,
  token: UseQueryResult<CarnegieTokenResponse, Error>,
  questionnaires: QuestionnaireItem[],
): QuestionnaireForm[] =>
  questionnaires.map(q => ({
    name: q.name,
    origin: q.origin,
    reference: q.reference,
    status: q.status,
    label: t(`questionnaires:${q.origin}.${q?.reference?.trim() ?? q.name.trim()}.label` as any),
    title: t(`questionnaires:${q.origin}.${q?.reference?.trim() ?? q.name.trim()}.title` as any),
    sortOrder: q.sortOrder,
    onClick: () => getQuestionnaireItemNavigation(q, personId, token, navigate),
  }))
