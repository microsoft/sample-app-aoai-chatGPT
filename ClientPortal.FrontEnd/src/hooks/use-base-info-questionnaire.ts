import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { PersonResponse, QuestionnaireStartResponse } from '../types'
import { generateBaseInfoQuestionnaire } from '../utils/base-info'
import { toBffBaseInfoValues } from '../utils/base-info/to-bff-base-info-values'
import { safelyParse } from '../utils/safely-parse'
import { useBff } from './api/use-bff'
import { useCountries } from './react-query/use-countries'

type Options = {
  customerId: number
  debug?: boolean
}

type State = {
  data: QuestionnaireStartResponse | undefined
  error: Error | undefined
  isLoading: boolean
  loadingButton: 'next' | 'previous' | null
}

type UseBaseInfoQuestionnaire = State & {
  onNext(fieldValues: FieldValues): void
  onPrevious(fieldValues: FieldValues): void
}

export const useBaseInfoQuestionnaire = ({
  customerId,
  debug = false,
}: Options): UseBaseInfoQuestionnaire => {
  const { t } = useTranslation('questionnaires')
  const bff = useBff()
  const [page, setPage] = useState<number>(1)
  const [data, setData] = useState<QuestionnaireStartResponse>()
  const [personData, setPersonData] = useState<PersonResponse>()
  const [error, setError] = useState<Error | undefined>()
  const [loadingButton, setLoadingButton] = useState<'next' | 'previous' | null>(null)
  const countries = useCountries()

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleNext = () => setPage(x => (x += 1))

  const handleError = (err: AxiosError) => {
    if (err.status && err.status >= 500) {
      scrollToTop()
      return setError(err)
    }

    if (!err.response?.data) {
      scrollToTop()
      return setError(err)
    }

    const parsed = safelyParse(err.response.data as string)

    if (!Object.keys(parsed?.errors ?? {}).length) {
      scrollToTop()
      return setError(err)
    }

    setData(current => ({
      ...(current as QuestionnaireStartResponse),

      ruleViolations: [
        ...(parsed.errors?.Citizenships
          ? [
              {
                fieldId: 'citizenships',
                fieldText: '',
                message: 'Du har inte fyllt i korrekt värde(n) för medborgarskap.',
                questionId: '',
              },
            ]
          : []),
        ...(parsed.errors?.Confirmation
          ? [
              {
                fieldId: 'confirmation',
                fieldText: '',
                message: 'Du måste bekräfta att läst igenom och förstått våra villkor.',
                questionId: '',
              },
            ]
          : []),
        ...(parsed.errors?.['Citizenships.Identifier']
          ? parsed.errors['Citizenships.Identifier'].map((countryIdentificationCode: string) => {
              return {
                fieldId: countryIdentificationCode,
                fieldText: '',
                message: 'Du har inte fyllt i korrekt värde(n) för medborgarskap.',
                questionId: '',
              }
            })
          : []),
        ...(parsed.errors?.['TaxCountries.CountryCode']
          ? [
              {
                fieldId: 'primary_tax_country',
                fieldText: '',
                message: 'Du har inte fyllt i korrekt värde(n) för skattehemvist.',
                questionId: '',
              },
              {
                fieldId: 'more_tax_countries',
                fieldText: '',
                message: 'Du har inte fyllt i korrekt värde(n) för skattehemvist.',
                questionId: '',
              },
            ]
          : []),
        ...(parsed.errors?.['TaxCountries.Tin']
          ? [
              {
                fieldId: 'more_tax_countries',
                fieldText: '',
                message: 'Du har inte fyllt i korrekt värde(n) för skattehemvist.',
                questionId: '',
              },
              {
                fieldId: 'usa_specific_tin',
                fieldText: '',
                message: 'Du har inte fyllt i korrekt värde(n) för skattehemvist.',
                questionId: '',
              },
            ]
          : []),
      ],
    }))
  }

  const onNext = (fieldValues: FieldValues) => {
    setLoadingButton('next')
    setData(current => (current ? { ...current, ruleViolations: [] } : undefined))

    if (debug) console.debug('[onNext] fieldValues', fieldValues)

    switch (page) {
      case 2:
        return bff
          .put(`/persons/${customerId}/base-info`, toBffBaseInfoValues(fieldValues))
          .then(handleNext)
          .catch(handleError)
          .finally(() => setLoadingButton(null))

      default:
        handleNext()
        setLoadingButton(null)
        break
    }
  }

  const onPrevious = () => {
    setLoadingButton('previous')
    setPage(x => (x -= 1))
    setLoadingButton(null)
  }

  useEffect(() => {
    if (!customerId || !countries.data) return

    bff
      .get<PersonResponse>(`/persons/${customerId}`)
      .then(res => {
        setData(
          generateBaseInfoQuestionnaire({ t, countries: countries.data, page, person: res.data }),
        )
        setPersonData(res.data)
      })
      .catch(handleError)
      .finally(() => setLoadingButton(null))
  }, [customerId, page])

  useEffect(() => {
    if (!customerId || !countries.data || !personData) return

    setData(
      generateBaseInfoQuestionnaire({ t, countries: countries.data, page, person: personData }),
    )
  }, [t])

  return {
    data,
    error,
    isLoading: !data && !error,
    loadingButton,
    onNext,
    onPrevious,
  }
}
