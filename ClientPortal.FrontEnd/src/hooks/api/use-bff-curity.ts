import { AxiosResponse } from 'axios'
import { useState } from 'react'
import { useAxios } from '../base/use-axios'

type LoginStartResponse = {
  authorizationRequestUrl: string
}

type LogoutUserResponse = {
  url: string
}

type LoginEndResponse = {
  csrf: string
  handled: boolean
  isLoggedIn: boolean
}

export interface BffCurity {
  getAntiForgeryToken(): string | undefined
  handleAssertionToken(assertionToken: string): Promise<AxiosResponse<void>>
  handlePageLoad(): Promise<AxiosResponse<LoginEndResponse>>
  login(): Promise<AxiosResponse<LoginStartResponse>>
  logout(): Promise<AxiosResponse<LogoutUserResponse>>
  refresh(): Promise<AxiosResponse<void>>
}

export const useBffCurity = (baseUrl: string): BffCurity => {
  const [csrf, setCsrf] = useState<string>()
  const axios = useAxios(baseUrl, { withCredentials: true })

  const getAntiForgeryToken = () => csrf

  const handleAssertionToken = async (assertionToken: string) =>
    await axios.post<void>(
      '/oauth-agent/login/jwt-assertion',
      { assertionToken },
      { headers: { 'x-curity-csrf': csrf } },
    )

  const handlePageLoad = async () => {
    const res = await axios.post<LoginEndResponse>('/oauth-agent/login/end', {
      pageUrl: location.href,
    })
    setCsrf(res.data.csrf)
    return res
  }

  const login = async () => await axios.post<LoginStartResponse>('/oauth-agent/login/start')

  const logout = async () =>
    await axios.post<LogoutUserResponse>('/oauth-agent/logout', undefined, { headers: { 'x-curity-csrf': csrf } })

  const refresh = async () =>
    await axios.post<void>('/oauth-agent/refresh', undefined, {
      headers: { 'x-curity-csrf': csrf },
    })

  return {
    getAntiForgeryToken,
    handleAssertionToken,
    handlePageLoad,
    login,
    logout,
    refresh,
  }
}
