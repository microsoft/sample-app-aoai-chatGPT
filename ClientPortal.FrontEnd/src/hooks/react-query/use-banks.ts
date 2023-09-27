import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { BankModel } from '../../types/bff/transfer'
import { useBff } from '../api/use-bff'

export const useBanks = (): UseQueryResult<BankModel[], Error> => {
  const bff = useBff()

  return useQuery<BankModel[], Error>({
    queryKey: ['use-banks'],
    queryFn: () => bff.get(`/transfer/banks`).then(({ data }) => data.item),
  })
}
