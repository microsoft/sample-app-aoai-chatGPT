import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { QuestionnairesResponse } from '../../types'
import { useBff } from '../api/use-bff'

export const useQuestionnaires = (
  customerId: number,
): UseQueryResult<QuestionnairesResponse, Error> => {
  const bff = useBff()

  return useQuery<QuestionnairesResponse, Error>({
    cacheTime: 2000,
    queryKey: ['use-questionnaires'],
    queryFn: () => bff.get(`/questionnaires/${customerId}`).then(({ data }) => data),
  })
}
