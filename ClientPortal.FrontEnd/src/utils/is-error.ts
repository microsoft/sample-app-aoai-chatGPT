import { AxiosError } from 'axios'

export const isUnauthorizedError = (error: any): error is AxiosError =>
  error && error instanceof AxiosError && error.response?.status === 401

export const isForbiddenError = (error: any): error is AxiosError =>
  error && error instanceof AxiosError && error.response?.status === 403

export const isUnknownNetworkError = (error: any): error is AxiosError =>
  error && error instanceof AxiosError && !error.response?.status && error.code === 'ERR_NETWORK'
