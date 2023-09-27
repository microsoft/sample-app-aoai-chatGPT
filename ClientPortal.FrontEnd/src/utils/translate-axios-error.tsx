import { AxiosError } from 'axios'
import { TFunction } from 'i18next'
import { safelyParse } from './safely-parse'

type Result = {
  title: string
  description: string
}

const parseAxiosError = (error: AxiosError): Result => {
  const parsed =
    error instanceof AxiosError && error.response?.data
      ? safelyParse(error.response?.data)
      : undefined

  const detail = parsed?.detail ? parsed.detail.replace(/HttpStatusCode:\w+\s?/, '') : undefined

  return {
    title: error.message,
    description: detail || error.toString(),
  }
}

export const translateAxiosError = (t: TFunction<'errors'>, error: AxiosError): Result => {
  switch (error.response?.status) {
    case 400:
      return {
        title: t('statusCode.400.title'),
        description: t('statusCode.400.description'),
      }

    case 401:
      return {
        title: t('statusCode.401.title'),
        description: t('statusCode.401.description'),
      }

    case 403:
      return {
        title: t('statusCode.403.title'),
        description: t('statusCode.403.description'),
      }

    case 404:
      return {
        title: t('statusCode.404.title'),
        description: t('statusCode.404.description'),
      }

    case 500:
    case 502:
      return {
        title: t('statusCode.500.title'),
        description: t('statusCode.500.description'),
      }

    case 503:
      return {
        title: t('statusCode.503.title'),
        description: t('statusCode.503.description'),
      }

    case 504:
      return {
        title: t('statusCode.504.title'),
        description: t('statusCode.504.description'),
      }

    default:
      return window?.ENV?.DEBUG
        ? parseAxiosError(error)
        : { title: t('statusCode.default.title'), description: t('statusCode.default.description') }
  }
}
