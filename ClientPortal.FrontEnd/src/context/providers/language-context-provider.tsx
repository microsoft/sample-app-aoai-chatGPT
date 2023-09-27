import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StringParam, useQueryParam } from 'use-query-params'
import { ContextProvider } from '../../types'
import { noop } from '../../utils/noop'
import { safelyParse } from '../../utils/safely-parse'

type ContextState = {
  language: string
  error: Error | undefined
}

type ContextFunctions = {
  setLanguage(language: string): void
}

type ContextValue = ContextState & ContextFunctions

const initialState = {
  language: 'sv',
  error: undefined,
} satisfies ContextState

const Context = createContext<ContextValue>({
  ...initialState,

  setLanguage: noop,
})

export const LanguageContextProvider: ContextProvider = ({ children }) => {
  const { i18n } = useTranslation()
  const [error, setError] = useState<Error | undefined>()
  const [query, setQuery] = useQueryParam('language', StringParam)

  const setLanguage = (language: string) => {
    try {
      i18n.changeLanguage(language)
    } catch (err) {
      setError(error)
    }
  }

  useEffect(() => {
    if (!query) return

    try {
      i18n.changeLanguage(query)
      setQuery(undefined)
    } catch (err) {
      setError(error)
    }
  }, [query])

  const contextValue: ContextValue = useMemo(
    () => ({
      language:
        safelyParse(window.ENV?.USE_TRANSLATIONS) === true ? i18n.resolvedLanguage ?? 'sv' : 'sv',
      error,
      setLanguage,
    }),
    [i18n.resolvedLanguage, error],
  )

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export const useLanguage = (): ContextValue => useContext<ContextValue>(Context)
