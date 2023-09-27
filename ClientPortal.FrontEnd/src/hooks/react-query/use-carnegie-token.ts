import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useBff } from '../api/use-bff'
import { CarnegieTokenResponse } from '../../types/bff/carnegie-token'

export const useCarnegieToken = (
): UseQueryResult<CarnegieTokenResponse, Error> => {
  const bff = useBff()

  return useQuery<CarnegieTokenResponse, Error>({
    cacheTime: 360000,
    queryKey: ['use-carnegie-token'],
    queryFn: () =>
      bff
        .get(`/token/carnegie`)
        .then(({ data }) => data),
  })
}
