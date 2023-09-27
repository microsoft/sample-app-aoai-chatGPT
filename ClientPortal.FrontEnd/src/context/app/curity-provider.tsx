import { IS_DEBUG } from '../../constants'
import { ContextProvider } from '../../types'
import { CurityContextProvider } from '../providers/curity-context-provider'

export const CurityProvider: ContextProvider = ({ children }) => (
  <CurityContextProvider
    bffUrl={import.meta.env.VITE_BFF_URL}
    debug={IS_DEBUG}
    refreshTokenInterval={parseInt(import.meta.env.VITE_REFRESH_TOKEN_INTERVAL)}
  >
    {children}
  </CurityContextProvider>
)
