import { FlexCol, SkeletonRect } from '@carnegie/duplo'
import { FC } from 'react'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { FormIncompleteBanner } from '../components/banners/FormIncompleteBanner'
import { BrioInputQuestionnaire } from '../components/brio'
import { QuestionnaireStatus } from '../enums'
import { useBaseInfoQuestionnaire } from '../hooks/use-base-info-questionnaire'
import { useQuestionnaireForms } from '../hooks/use-questionnaire-forms'

type Props = {
  debug?: boolean
  customerId: number
  onClose(): void
}

const isRemaining = (q: { status: QuestionnaireStatus }) =>
  [
    QuestionnaireStatus.PreCreation,
    QuestionnaireStatus.Creating,
    QuestionnaireStatus.Pending,
  ].includes(q.status)

export const BaseInfoQuestionnaireContainer: FC<Props> = ({
  debug = false,
  customerId,
  onClose,
}) => {
  const { data, error, isLoading, loadingButton, onNext, onPrevious } = useBaseInfoQuestionnaire({
    customerId,
    debug,
  })
  const forms = useQuestionnaireForms(customerId).filter(isRemaining)

  if (isLoading) {
    return <SkeletonRect height={500} width="full" />
  }

  if (!data) {
    return <ErrorBanner error={new Error('Questionnaire not found')} />
  }

  return (
    <FlexCol gap={8}>
      {!!data?.ruleViolations?.length && <FormIncompleteBanner />}
      {error && <ErrorBanner debug={debug} error={error} />}
      <BrioInputQuestionnaire
        debug={debug}
        finalPageForms={forms}
        loading={loadingButton}
        navigation={data.pageDefinition.navigation}
        ruleViolations={data.ruleViolations}
        subNodes={data.pageDefinition.rootNode.subNodes}
        onClose={onClose}
        onFinalPageInterval={onClose}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    </FlexCol>
  )
}
