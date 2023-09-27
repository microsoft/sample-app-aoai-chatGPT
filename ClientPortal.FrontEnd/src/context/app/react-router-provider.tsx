import { BrowserRouter } from 'react-router-dom'
import { ContextProvider } from '../../types'

export const ReactRouterProvider: ContextProvider = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)
