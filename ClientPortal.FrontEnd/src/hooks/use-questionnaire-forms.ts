import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  QuestionnaireForm,
  mapQuestionnairesToForms,
} from '../utils/questionnaire-list/map-questionnaires-to-forms'
import { useQuestionnaires } from './react-query/use-questionnaires'
import { useUser } from '../context'
import { useCarnegieToken } from './react-query/use-carnegie-token'

export const useQuestionnaireForms = (customerId: number): QuestionnaireForm[] => {
  const { t } = useTranslation('questionnaires')
  const navigate = useNavigate()
  const { data } = useQuestionnaires(customerId)
  const user = useUser()
  const token = useCarnegieToken()

  if (!data) return []

  return mapQuestionnairesToForms(t, navigate, user.id, token, data.questionnaires)
}
