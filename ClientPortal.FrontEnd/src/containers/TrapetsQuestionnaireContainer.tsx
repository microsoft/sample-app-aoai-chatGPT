import { FlexCol, SkeletonRect } from '@carnegie/duplo'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { FormIncompleteBanner } from '../components/banners/FormIncompleteBanner'
import { BrioInputQuestionnaire } from '../components/brio'
import { useUser } from '../context'
import { QuestionnaireItemOrigin, QuestionnaireStatus } from '../enums'
import { useCarnegieToken } from '../hooks/react-query/use-carnegie-token'
import { useQuestionnaires } from '../hooks/react-query/use-questionnaires'
import { useQuestionnaireForms } from '../hooks/use-questionnaire-forms'
import { useTrapetsQuestionnaire } from '../hooks/use-trapets-questionnaire'
import { mapQuestionnairesToForms } from '../utils/questionnaire-list'

type Props = {
  questionnaireId: number
  debug?: boolean
  customerId: number
  reference: string
  onClose(): void
}

const isNotReference = (reference: string) => (q: { reference: string | null }) =>
  q.reference !== reference
const isRemaining = (q: { status: QuestionnaireStatus }) =>
  [
    QuestionnaireStatus.PreCreation,
    QuestionnaireStatus.Creating,
    QuestionnaireStatus.Pending,
    QuestionnaireStatus.UpdateRequired,
  ].includes(q.status)
const isPending = (q: { status: QuestionnaireStatus }) =>
  q.status === QuestionnaireStatus.Pending || q.status === QuestionnaireStatus.UpdateRequired

export const TrapetsQuestionnaireContainer: FC<Props> = ({
  questionnaireId,
  debug = false,
  customerId,
  reference,
  onClose,
}) => {
  const { t } = useTranslation('questionnaires')
  const navigate = useNavigate()
  const { data, error, isLoading, loadingButton, onNext, onPrevious } = useTrapetsQuestionnaire({
    customerId,
    debug,
    questionnaireId,
    reference,
  })
  const [gracePeriod, setGracePeriod] = useState<boolean>(false)
  const { refetch } = useQuestionnaires(customerId)
  const forms = useQuestionnaireForms(customerId).filter(isRemaining)
  const user = useUser()
  const token = useCarnegieToken()

  const onInterval = () =>
    refetch().then(res => {
      if (!res.data?.questionnaires) return

      const questionnaires = res.data.questionnaires
      const remaining = questionnaires.filter(isNotReference(reference)).filter(isRemaining)

      if (remaining.length === 0) {
        return onClose()
      }

      const pending = questionnaires.filter(isNotReference(reference)).find(isPending)

      if (pending) {
        const [mapped] = mapQuestionnairesToForms(t, navigate, user.id, token, [pending])
        if (mapped.origin !== QuestionnaireItemOrigin.ClientInformation) {
          return mapped.onClick()
        }
      }
    })

  useEffect(() => {
    if (isLoading) return
    const timeout = setTimeout(() => setGracePeriod(true), 5000)

    return () => clearTimeout(timeout)
  }, [isLoading])

  if (isLoading || !data) {
    return <SkeletonRect height={500} width="full" />
  }

  if (!data && gracePeriod) {
    return <ErrorBanner debug={debug} error={new Error('Questionnaire not found')} />
  }

  if (!data) {
    return <SkeletonRect height={500} width="full" />
  }

  return (
    <FlexCol gap={8}>
      {!!data?.ruleViolations?.length && <FormIncompleteBanner />}
      {error && <ErrorBanner error={error} />}
      <BrioInputQuestionnaire
        debug={debug}
        finalPageForms={forms}
        loading={loadingButton}
        navigation={data.pageDefinition.navigation}
        ruleViolations={data.ruleViolations}
        subNodes={data.pageDefinition.rootNode.subNodes}
        onClose={onClose}
        onFinalPageInterval={onInterval}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    </FlexCol>
  )
}
