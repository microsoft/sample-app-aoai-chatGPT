import { SkeletonRect } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { BrioReadQuestionnaire } from '../components/brio'
import { useCountries } from '../hooks/react-query/use-countries'
import { usePerson } from '../hooks/react-query/use-person'
import { generateBaseInfoPages } from '../utils/base-info'

type Props = {
  customerId: number
  debug?: boolean
}

export const BaseInfoReadContainer: FC<Props> = ({ customerId, debug = false }) => {
  const { t } = useTranslation('questionnaires')
  const countries = useCountries()
  const person = usePerson(customerId)

  // Aggregated
  const isLoading = countries.isLoading || person.isLoading
  const error = countries.error || person.error

  if (isLoading) {
    return <SkeletonRect height={500} width="full" />
  }

  if (error) {
    return <ErrorBanner debug={debug} error={error} />
  }

  if (!countries.data || !person.data) {
    return <ErrorBanner error={new Error('Data not found')} />
  }

  const pages = generateBaseInfoPages({ t, countries: countries.data, person: person.data })

  return <BrioReadQuestionnaire debug={debug} pages={pages.slice(0, -1)} />
}
