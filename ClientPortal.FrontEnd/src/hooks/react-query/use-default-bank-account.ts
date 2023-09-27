import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { DefaultBankAccount } from '../../types/bff/transfer'
import { useBff } from '../api/use-bff'

export const useDefaultBankAccount = (): UseQueryResult<DefaultBankAccount | null, Error> => {
  const bff = useBff()

  return useQuery<DefaultBankAccount | null, Error>({
    queryKey: ['use-default-bank-account'],
    queryFn: () => bff.get(`/transfer/default-bank-account`).then(({ data }) => data.item || null),
  })
}
