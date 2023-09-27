import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { PersonResponse } from '../../types'
import { useBff } from '../api/use-bff'

export const usePerson = (id: number): UseQueryResult<PersonResponse, Error> => {
  const bff = useBff()

  return useQuery<PersonResponse, Error>({
    queryKey: ['use-person', id],
    queryFn: () => bff.get(`/persons/${id}`).then(({ data }) => data),
  })
}
