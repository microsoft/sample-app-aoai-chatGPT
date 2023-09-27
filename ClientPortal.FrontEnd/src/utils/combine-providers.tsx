import { ComponentProps, ReactElement } from 'react'
import { ContextProvider } from '../types/context-provider'

export const combineProviders = (...providers: Array<ContextProvider>): ContextProvider =>
  providers.reduce(
    (AccumulatedProviders, CurrentProvider) =>
      // eslint-disable-next-line react/display-name
      ({ children }: ComponentProps<ContextProvider>): ReactElement =>
        (
          <AccumulatedProviders>
            <CurrentProvider>{children}</CurrentProvider>
          </AccumulatedProviders>
        ),
    ({ children }) => <>{children}</>,
  )
