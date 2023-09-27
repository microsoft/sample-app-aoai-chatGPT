import { Banner } from '@carnegie/duplo'
import { AxiosError } from 'axios'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { translateAxiosError } from '../../utils/translate-axios-error'

type Severity = 'critical' | 'success' | 'information' | 'warning'
type Props = {
  debug?: boolean | string
  description?: string
  error?: AxiosError | Error
  severity?: Severity
  title?: string
}

export const ErrorBanner: FC<Props> = ({ debug, description, error, severity, title }) => {
  const { t } = useTranslation(['errors', 'banners'])
  const axiosError = error instanceof AxiosError ? translateAxiosError(t, error) : undefined

  const errorDescription =
    axiosError?.description ?? description ?? debug
      ? error?.message ?? error?.toString() ?? t('errors:statusCode.default.description')
      : t('errors:statusCode.default.description')

  return (
    <Banner
      severity={severity ?? 'critical'}
      title={axiosError?.title ?? title ?? t('errors:statusCode.default.title')}
      description={errorDescription}
    />
  )
}
