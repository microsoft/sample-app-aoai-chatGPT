import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { QuestionnaireResponse } from '../../types'
import { useBff } from '../api/use-bff'

export const useQuestionnaire = (
  customerId: number,
  questionnaireId: number,
): UseQueryResult<QuestionnaireResponse, Error> => {
  const bff = useBff()

  return useQuery<QuestionnaireResponse, Error>({
    cacheTime: 360000,
    queryKey: ['use-questionnaire', questionnaireId],
    queryFn: () =>
      bff
        .get(`/customers/${customerId}/questionnaires/${questionnaireId}`)
        .then(({ data }) => data),
  })
}
