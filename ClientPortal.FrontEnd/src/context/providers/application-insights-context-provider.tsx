import { Breakpoint } from '@carnegie/duplo'
import { ReactPlugin } from '@microsoft/applicationinsights-react-js'
import {
  ApplicationInsights,
  ITelemetryItem,
  SeverityLevel,
} from '@microsoft/applicationinsights-web'
import { createContext, useCallback, useContext, useMemo } from 'react'
import i18n from '../../i18next.config'
import { ContextProvider } from '../../types'

/**
 * For react-router v6 or other scenarios where
 * router history isn't exposed, Application Insights
 * configuration enableAutoRouteTracking can be used
 * to auto-track router changes
 *
 * https://learn.microsoft.com/en-us/azure/azure-monitor/app/javascript-react-plugin
 */

type ContextProps = {
  appId: string
  apiKey: string
  enabled?: boolean
  cors?: boolean
}

export type TrackEvent = (name: string, custom?: Record<string, any>) => void
export type TrackException = (error: Error, custom?: Record<string, any>) => void

type ContextValue = {
  trackEvent: TrackEvent
  trackException: TrackException
}

const Context = createContext<ContextValue>({
  trackEvent: () => undefined,
  trackException: () => undefined,
})

export const ApplicationInsightsContextProvider: ContextProvider<ContextProps> = ({
  appId,
  apiKey,
  children,
  enabled = true,
  cors = false,
}) => {
  const reactPlugin = useMemo(() => new ReactPlugin(), [])

  const appInsights = useMemo(() => {
    if (!enabled) return

    const instance = new ApplicationInsights({
      config: {
        instrumentationKey: apiKey,
        loggingLevelConsole: 2,
        disableFetchTracking: false,
        enableCorsCorrelation: cors,
        enableAutoRouteTracking: true,
        extensions: [reactPlugin],
      },
    })

    instance.loadAppInsights()
    instance.trackPageView()

    instance.addTelemetryInitializer(envelope => {
      if (!envelope.tags) envelope.tags = []
      envelope.tags.push({ 'ai.cloud.role': appId })
    })

    const getClientBreakpoint = () => {
      const breakpoints = [
        { name: 'xl', query: `(min-width: ${Breakpoint.Xl}px)` },
        { name: 'lg', query: `(min-width: ${Breakpoint.Large}px)` },
        { name: 'md', query: `(min-width: ${Breakpoint.Medium}px)` },
        { name: 'sm', query: `(min-width: ${Breakpoint.Small}px)` },
        { name: 'xs', query: `(min-width: ${Breakpoint.Xs}px)` },
      ]

      const breakpoint = breakpoints.find(({ query }) => window.matchMedia(query).matches)?.name
      return breakpoint ?? 'xs'
    }

    const customClientInfo = (envelope: ITelemetryItem) => {
      envelope.data = {
        ...envelope?.data,
        breakpoint: getClientBreakpoint(),
        language: i18n.language,
      }
    }

    instance.addTelemetryInitializer(customClientInfo)

    return instance
  }, [appId, apiKey, cors, enabled, reactPlugin])

  // callbacks

  const trackEvent = useCallback(
    (name: string, custom?: Record<string, any>) => appInsights?.trackEvent({ name }, custom),
    [appInsights],
  )

  const trackException = useCallback(
    (error: Error, custom?: Record<string, any>) =>
      appInsights?.trackException(
        {
          error,
          exception: error,
          severityLevel: SeverityLevel.Error,
        },
        custom,
      ),
    [appInsights],
  )

  // provider

  const contextValue: ContextValue = useMemo(
    () => ({
      trackEvent,
      trackException,
    }),
    [trackEvent, trackException],
  )

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export const useApplicationInsightsContext = (): ContextValue => useContext<ContextValue>(Context)
