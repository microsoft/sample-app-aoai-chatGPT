import { AxiosResponse } from 'axios'
import { useEffect, useState } from 'react'
import { FieldValues } from 'react-hook-form'
import { QuestionnaireStartResponse } from '../types'
import { fromTrapetsValues } from '../utils/trapets'
import { filterTrapetsValues } from '../utils/trapets/filter-trapets-values'
import { toTrapetsValues } from '../utils/trapets/to-trapets-values'
import { useBff } from './api/use-bff'

type Options = {
  customerId: number
  debug?: boolean
  questionnaireId: number
  reference: string
}

type State = {
  data: QuestionnaireStartResponse | undefined
  error: Error | undefined
  isLoading: boolean
  loadingButton: 'next' | 'previous' | null
}

type UseQuestionnaire = State & {
  onNext(fieldValues: FieldValues): void
  onPrevious(fieldValues: FieldValues): void
}

export const useTrapetsQuestionnaire = ({
  customerId,
  debug = false,
  questionnaireId,
  reference,
}: Options): UseQuestionnaire => {
  const bff = useBff()
  const [data, setData] = useState<QuestionnaireStartResponse>()
  const [error, setError] = useState<Error | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingButton, setLoadingButton] = useState<'next' | 'previous' | null>(null)
  const [started, setStarted] = useState<boolean>(false)

  const handleResponse = (res: AxiosResponse<QuestionnaireStartResponse>): void => {
    switch (res.data.status) {
      case 'OK':
        setError(undefined)
        return setData(fromTrapetsValues(res.data))

      case 'ValidationError':
        setError(undefined)
        return setData(current =>
          current
            ? { ...current, status: res.data.status, ruleViolations: res.data.ruleViolations }
            : undefined,
        )

      default:
        throw new Error(res.data.status)
    }
  }

  const onNext = (fieldValues: FieldValues) => {
    setLoadingButton('next')
    setData(current => (current ? { ...current, ruleViolations: [] } : undefined))

    if (debug) console.debug('[onNext] fieldValues', fieldValues)

    bff
      .post<QuestionnaireStartResponse>('/questionnaires/next', {
        fieldValues: filterTrapetsValues(
          toTrapetsValues(fieldValues),
          data?.pageDefinition.rootNode.subNodes,
        ),
        reference,
      })
      .then(handleResponse)
      .catch(err => setError(err))
      .finally(() => setLoadingButton(null))
  }

  const onPrevious = (fieldValues: FieldValues) => {
    setLoadingButton('previous')
    setData(current => (current ? { ...current, ruleViolations: [] } : undefined))

    if (debug) console.debug('[onPrevious] fieldValues', fieldValues)

    bff
      .post<QuestionnaireStartResponse>('/questionnaires/previous', {
        fieldValues: filterTrapetsValues(
          toTrapetsValues(fieldValues),
          data?.pageDefinition.rootNode.subNodes,
        ),
        reference,
      })
      .then(handleResponse)
      .catch(err => setError(err))
      .finally(() => setLoadingButton(null))
  }

  useEffect(() => {
    if (!questionnaireId) return
    if (!reference) return
    if (isLoading) return
    if (started) return

    setIsLoading(true)

    bff
      .get<QuestionnaireStartResponse>(
        `/customers/${customerId}/questionnaires/${questionnaireId}/start?reference=${reference}`,
      )
      .then(handleResponse)
      .then(() => setStarted(true))
      .catch(err => setError(err))
      .finally(() => setIsLoading(false))
  }, [questionnaireId, reference])

  return {
    data,
    error,
    isLoading,
    loadingButton,
    onNext,
    onPrevious,
  }
}
