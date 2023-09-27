import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ContextProvider } from '../../types'

const client = new QueryClient()

export const ReactQueryProvider: ContextProvider = ({ children }) => (
  <QueryClientProvider client={client}>
    {import.meta.env.DEV && <ReactQueryDevtools />}
    {children}
  </QueryClientProvider>
)
