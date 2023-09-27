import { combineProviders } from '../../utils/combine-providers'
import { LanguageContextProvider } from '../providers/language-context-provider'
import { UserContextProvider } from '../providers/user-context-provider'
import { ApplicationInsightsProvider } from './application-insights-provider'
import { CurityProvider } from './curity-provider'
import { DuploProvider } from './duplo-provider'
import { QueryParamProvider } from './query-param-provider'
import { ReactQueryProvider } from './react-query-provider'
import { ReactRouterProvider } from './react-router-provider'

export const AppContextProviders = combineProviders(
  ReactRouterProvider,
  ApplicationInsightsProvider,
  DuploProvider,
  QueryParamProvider,
  ReactQueryProvider,
  CurityProvider,
  UserContextProvider,
  LanguageContextProvider,
)
