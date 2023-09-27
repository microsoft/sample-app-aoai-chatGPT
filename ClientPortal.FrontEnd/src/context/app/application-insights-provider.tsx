import { ContextProvider } from '../../types'
import { safelyParse } from '../../utils/safely-parse'
import { ApplicationInsightsContextProvider } from '../providers/application-insights-context-provider'

export const ApplicationInsightsProvider: ContextProvider = ({ children }) => (
  <ApplicationInsightsContextProvider
    appId="ClientPortal.FrontEnd"
    apiKey={window.ENV?.AI_API_KEY}
    cors={safelyParse(window.ENV?.AI_CORS) === true}
    enabled={safelyParse(import.meta.env.VITE_AI_ENABLED) === true}
  >
    {children}
  </ApplicationInsightsContextProvider>
)
