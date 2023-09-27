import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { StringParam, useQueryParams } from 'use-query-params'
import { IS_ASSERTION_TOKEN, REDIRECT_URI_KEY } from '../../constants'
import { useBffCurity } from '../../hooks/api/use-bff-curity'
import { useLocalStorage, useSessionState, useSessionStorage } from '../../hooks/storage'
import { ContextProvider } from '../../types'

const I18N = 'i18nextLng'

type ContextProps = {
  bffUrl: string
  debug?: boolean
  refreshTokenInterval?: number
}

type ContextState = {
  error: Error | undefined
  isLoading: boolean
  isLoggedIn: boolean
  isRefreshing: boolean
}

type ContextStored = {
  isAssertion: boolean
}

type ContextFunctions = {
  getAntiForgeryToken(): string | undefined
  handleAssertionToken(token: string, redirectUri?: string): Promise<void>
  login(redirectUri?: string): Promise<void>
  logout(): Promise<void>
}

type ContextValue = ContextState & ContextStored & ContextFunctions

const initialState = {
  error: undefined,
  isLoading: true,
  isLoggedIn: false,
  isRefreshing: false,
} satisfies ContextState

const Context = createContext<ContextValue>({
  ...initialState,
  isAssertion: false,

  getAntiForgeryToken: () => undefined,
  handleAssertionToken: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  login: () => Promise.resolve(),
})

export const CurityContextProvider: ContextProvider<ContextProps> = ({
  bffUrl,
  children,
  debug = false,
  refreshTokenInterval = 60,
}) => {
  const [state, setState] = useState<ContextState>(initialState)
  const [isAssertion, setIsAssertion] = useSessionState<boolean>(IS_ASSERTION_TOKEN, false)
  const refreshRef = useRef<NodeJS.Timer>()
  const pageLoadRef = useRef<boolean>(false)
  const assertTokenRef = useRef<boolean>(false)

  const bff = useBffCurity(bffUrl)
  const sessionStorage = useSessionStorage()
  const localStorage = useLocalStorage()
  const navigate = useNavigate()

  const [query, setQuery] = useQueryParams({
    code: StringParam,
    iss: StringParam,
    session_state: StringParam,
    state: StringParam,
  })

  // internal functions

  const _setErrorState = (error: Error) =>
    setState({ error, isLoggedIn: false, isLoading: false, isRefreshing: false })

  const _handlePageLoad = async (redirectUri?: string) => {
    pageLoadRef.current = true

    if (debug) console.debug('Handling page load', { redirectUri, query })

    setState(current => ({ ...current, isLoading: true }))

    try {
      const res = await bff.handlePageLoad()

      setQuery({
        code: undefined,
        iss: undefined,
        session_state: undefined,
        state: undefined,
      })

      setState(current => ({
        ...current,
        error: undefined,
        isLoggedIn: res.data.isLoggedIn,
        isLoading: false,
      }))

      sessionStorage.removeItem(REDIRECT_URI_KEY)

      if (redirectUri) {
        return navigate(redirectUri, { replace: true })
      }
    } catch (err) {
      _setErrorState(err as Error)
    } finally {
      pageLoadRef.current = false
    }
  }

  const _handleAssertionToken = async (assertionToken: string, redirectUri?: string) => {
    assertTokenRef.current = true

    if (debug) console.debug('Handling assertion token', { assertionToken, redirectUri })

    setIsAssertion(true)

    try {
      setState(current => ({ ...current, isLoggedIn: false }))

      await bff.handleAssertionToken(assertionToken)
      await _handlePageLoad(redirectUri)
    } catch (err) {
      _setErrorState(err as Error)
    } finally {
      assertTokenRef.current = false
    }
  }

  const _handleRefresh = async () => {
    setState(current => ({ ...current, isRefreshing: true }))

    try {
      await bff.refresh()
    } catch (err) {
      _setErrorState(err as Error)
    }

    setState(current => ({ ...current, isRefreshing: false }))
  }

  // public functions

  const getAntiForgeryToken = (): string | undefined => bff.getAntiForgeryToken()

  const handleAssertionToken = async (token: string, redirectUri?: string): Promise<void> => {
    if (assertTokenRef.current) return Promise.resolve()

    await _handleAssertionToken(token, redirectUri)
  }

  const login = (redirectUri?: string): Promise<void> => {
    if (debug) console.debug('Starting login', { redirectUri })
    if (redirectUri) sessionStorage.setItem(REDIRECT_URI_KEY, redirectUri)

    setIsAssertion(false)

    return bff
      .login()
      .then(res => {
        location.href = res.data.authorizationRequestUrl
      })
      .catch(_setErrorState)
  }

  const logout = (): Promise<void> => {
    if (debug) console.debug('Logging out')

    return bff
      .logout()
      .then(response => {
        sessionStorage.clear()

        const currentLang = localStorage.getItem(I18N)

        localStorage.clear()
        localStorage.setItem(I18N, currentLang ?? 'sv')

        location.href = response.data.url
      })
      .catch(_setErrorState)
  }

  // effect will run on page load

  useEffect(() => {
    if (pageLoadRef.current) return

    const redirectUri = sessionStorage.getItem<string>(REDIRECT_URI_KEY)

    _handlePageLoad(redirectUri)
  }, [pageLoadRef])

  // effect will run when user is logged in to keep token alive

  useEffect(() => {
    const clear = () => {
      if (!refreshRef.current) return
      if (debug) console.debug('Clearing refresh token interval')

      clearInterval(refreshRef.current)

      setState(current => ({ ...current, isRefreshing: false }))
    }

    if (
      state.isLoggedIn &&
      !isAssertion &&
      !refreshRef.current &&
      !assertTokenRef.current &&
      !pageLoadRef.current
    ) {
      if (debug) console.debug('Creating refresh token interval')

      refreshRef.current = setInterval(async () => {
        if (debug) console.debug('Refreshing token')

        await _handleRefresh()
      }, refreshTokenInterval * 1000)

      // TODO: refreshing on page load should be handled by BFF and not FE
      _handleRefresh()
    } else if (!state.isLoggedIn) {
      clear()
    }

    return () => clear()
  }, [state.isLoggedIn, isAssertion, refreshRef, assertTokenRef.current, pageLoadRef.current])

  const contextValue: ContextValue = useMemo(
    () => ({
      ...state,
      isAssertion,
      getAntiForgeryToken,
      handleAssertionToken,
      login,
      logout,
    }),
    [state],
  )

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export const useCurity = (): ContextValue => useContext<ContextValue>(Context)
