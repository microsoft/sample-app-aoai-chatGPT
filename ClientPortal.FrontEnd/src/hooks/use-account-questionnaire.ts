import { useEffect, useMemo, useState } from 'react'
import { FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  AccountState,
  AccountStateResponse,
  CreateAccountStateEnum,
  InitiateAccountResponse,
} from '../types/bff/account'
import { isAgreementSigned } from '../utils/account/account-state'
import { useBff } from './api/use-bff'

export const useAsyncEffect = (fn: () => void, deps: any[]) => {
  useEffect(() => {
    const asyncFn = async () => {
      await fn()
    }
    asyncFn()
  }, deps)
}

const LAST_PAGE_STEP = 2

type State = {
  page: number
  error: Error | undefined
  isLoading: boolean
  accountStateItem?: AccountState
}

type UseAccountQuestionnaire = State & {
  onNext(fieldValues: FieldValues): void
  onPrevious(): void
}

export const useAccountQuestionnaire = (): UseAccountQuestionnaire => {
  const bff = useBff()
  const { t } = useTranslation('components', { keyPrefix: 'accountPolicy' })
  const navigate = useNavigate()
  const [page, setPage] = useState<number>(1)
  const [postData, setPostData] = useState<FieldValues | undefined>(undefined)
  const [accountStateItem, setAccountState] = useState<AccountState | undefined>(undefined)
  const [fetchAccountStateIntervalId, setFetchAccountStateIntervalId] = useState<
    NodeJS.Timer | undefined
  >(undefined)
  const [error, setError] = useState<Error | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const fetchAccountState = async () => {
    const accountStateResponse = await bff.get<AccountStateResponse>(`/accounts/state`)

    setAccountState(accountStateResponse.data.item)
  }

  useAsyncEffect(fetchAccountState, [])

  const isPendingAgreement = useMemo(() => {
    if (!accountStateItem) return false

    return (
      accountStateItem.state === CreateAccountStateEnum.Initiated && !!accountStateItem.loginUrl
    )
  }, [accountStateItem])

  const triggerAccountStateListener = () => {
    setIsLoading(true)
    if (!fetchAccountStateIntervalId) {
      const intervalId = setInterval(fetchAccountState, 4000)
      setFetchAccountStateIntervalId(intervalId)
    }
  }

  const resetInterval = () => {
    clearInterval(fetchAccountStateIntervalId)
    setFetchAccountStateIntervalId(undefined)
    setIsLoading(false)
  }

  useEffect(() => {
    if (isPendingAgreement && page === LAST_PAGE_STEP) triggerAccountStateListener()

    return () => {
      if (fetchAccountStateIntervalId) resetInterval()
    }
  }, [isPendingAgreement, page])

  useEffect(() => {
    if (!fetchAccountStateIntervalId) return

    if (isAgreementSigned(accountStateItem?.state)) {
      resetInterval()
      navigate('/questionnaires/agreement-signed')
    }

    if (accountStateItem?.state === CreateAccountStateEnum.Failed) {
      resetInterval()
      setError(new Error(t('scriveErrorMessage')))
    }
  }, [accountStateItem])

  const handleNext = () => setPage(x => (x === LAST_PAGE_STEP ? x : (x += 1)))

  const onNext = async (fieldValues: FieldValues) => {
    switch (page) {
      case LAST_PAGE_STEP: {
        const scriveWindow = window.open('', '_blank') as any
        if (scriveWindow.trustedTypes && scriveWindow.trustedTypes.createPolicy) {
          scriveWindow.trustedTypes.createPolicy('default', {
            createHTML: (string: string) => string,
          })
        }
        scriveWindow?.document.write(t('scriveWindowLoadingMessage'))
        setError(undefined)
        setIsLoading(true)
        try {
          const initiateResponse = await bff.post<InitiateAccountResponse>(
            `/accounts/initiate`,
            postData,
          )

          if (!initiateResponse.data.item?.url) {
            setError(new Error(initiateResponse.data.error))
            setIsLoading(false)
            scriveWindow?.close()
            return
          }

          if (scriveWindow) scriveWindow.location.href = initiateResponse.data.item?.url
          fetchAccountState()
          // window.open(initiateResponse.data.item?.url, '_blank')
        } catch (error: any) {
          setError(new Error(JSON.parse(error.response.data).detail))
          setIsLoading(false)
          scriveWindow?.close()
          return
        }

        break
      }

      default:
        if (Object.keys(fieldValues).length > 0) setPostData(fieldValues)
        handleNext()
        break
    }
  }

  const onPrevious = () => {
    if (page === 1) {
      navigate('/')
      return
    }

    if (error) setError(undefined)
    setPage(x => (x -= 1))
  }

  return {
    page,
    error,
    isLoading,
    onNext,
    onPrevious,
    accountStateItem,
  }
}
