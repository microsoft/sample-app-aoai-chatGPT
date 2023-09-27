import { SkeletonRect } from '@carnegie/duplo'
import { FC, useEffect, useState } from 'react'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { DashboardBanner } from '../components/defaults/DashboardBanner'
import { usePerson } from '../hooks/react-query/use-person'
import { useQuestionnaires } from '../hooks/react-query/use-questionnaires'
import { useQuestionnaireForms } from '../hooks/use-questionnaire-forms'

type Props = {
  customerId: number
  debug?: boolean
  isProspect?: boolean
}

export const DashboardBannerContainer: FC<Props> = ({
  customerId,
  debug = false,
  isProspect = false,
}) => {
  const forms = useQuestionnaireForms(customerId)
  const questionnaires = useQuestionnaires(customerId)
  const person = usePerson(customerId)
  const [formsTimeout, setFormsTimeout] = useState(false)

  const isLoading = questionnaires.isLoading || person.isLoading
  const error = questionnaires.error || person.error

  const email = person?.data?.emails?.find(x => x.isPreferred)?.email
  const phoneNumber = person?.data?.phoneNumbers?.find(x => x.isPreferred)?.number

  useEffect(() => {
    const timer = setTimeout(() => setFormsTimeout(true), 12000)
    return () => clearTimeout(timer)
  }, [forms])

  if (isLoading) {
    return <SkeletonRect height={150} />
  }

  if (error) {
    return <ErrorBanner debug={debug} error={error} />
  }

  return (
    <DashboardBanner
      email={email}
      forms={forms}
      formsTimeout={formsTimeout}
      isProspect={isProspect}
      phoneNumber={phoneNumber}
    />
  )
}
