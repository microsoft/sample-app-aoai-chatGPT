import queryString from 'query-string'
import { QueryParamProvider as QueryParam } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'
import { ContextProvider } from '../../types'

// https://www.npmjs.com/package/use-query-params

export const QueryParamProvider: ContextProvider = ({ children }) => (
  <QueryParam
    adapter={ReactRouter6Adapter}
    options={{
      searchStringToObject: queryString.parse,
      objectToSearchString: queryString.stringify,
    }}
  >
    {children}
  </QueryParam>
)
