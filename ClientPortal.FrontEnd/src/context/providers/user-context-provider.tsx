import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { useBff } from '../../hooks/api/use-bff'
import { useLockedEffect } from '../../hooks/use-locked-effect'
import { ContextProvider, UserinfoResponse } from '../../types'
import { useCurity } from './curity-context-provider'

type ContextState = {
  id: number
  canSelfInitiate: boolean
  error: Error | undefined
  familyName: string
  givenName: string
  hasDashboardAccess: boolean
  isCustomer: boolean
  isEmployee: boolean
  isLoading: boolean
  isProspect: boolean
  name: string
}

type ContextFunctions = {
  reload(): Promise<void>
}

type ContextValue = ContextState & ContextFunctions

const initialState = {
  id: -1,
  canSelfInitiate: false,
  error: undefined,
  familyName: '',
  givenName: '',
  hasDashboardAccess: false,
  isCustomer: false,
  isEmployee: false,
  isLoading: true,
  isProspect: false,
  name: '',
} satisfies ContextState

const Context = createContext<ContextValue>({
  ...initialState,
  reload: () => Promise.resolve(),
})

export const UserContextProvider: ContextProvider = ({ children }) => {
  const [state, setState] = useState<ContextState>(initialState)
  const { isLoading, isLoggedIn, isRefreshing } = useCurity()
  const bff = useBff()
  const ref = useRef(false)

  const reload = () =>
    bff
      .get<UserinfoResponse>('/userinfo')
      .then(res =>
        setState({
          id: +res.data.id,
          canSelfInitiate: res.data.canSelfInitiate,
          error: undefined,
          familyName: res.data.surName,
          givenName: res.data.officialFirstName || res.data.firstName,
          hasDashboardAccess: res.data.hasDashboardAccess,
          isCustomer: res.data.isCustomer,
          isEmployee: res.data.isEmployee,
          isLoading: false,
          isProspect: res.data.isProspect,
          name: res.data.name,
        }),
      )
      .catch((error: Error) => setState({ ...initialState, error, isLoading: false }))

  useLockedEffect(() => {
    if (isLoading || isRefreshing) return

    if (!isLoggedIn) {
      return setState({ ...initialState, isLoading: false })
    }

    if (ref.current) return
    ref.current = true

    setState(current => ({ ...current, isLoading: true }))

    return reload()
  }, [isLoading, isLoggedIn, isRefreshing])

  const contextValue: ContextValue = useMemo(
    () => ({
      ...state,

      reload,
    }),
    [state],
  )

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export const useUser = (): ContextValue => useContext<ContextValue>(Context)
