import { SkeletonRect } from '@carnegie/duplo'
import { FC } from 'react'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { FormList } from '../components/form-list/FormList'
import { useQuestionnaires } from '../hooks/react-query/use-questionnaires'
import { useQuestionnaireForms } from '../hooks/use-questionnaire-forms'

type Props = {
  customerId: number
  debug?: boolean
}

export const FormListContainer: FC<Props> = ({ customerId, debug = false }) => {
  const forms = useQuestionnaireForms(customerId)
  const { isLoading, error } = useQuestionnaires(customerId)

  if (isLoading) {
    return <SkeletonRect height={500} />
  }

  if (error) {
    return <ErrorBanner debug={debug} error={error} />
  }

  return <FormList forms={forms} />
}
