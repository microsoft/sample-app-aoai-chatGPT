import { Button, FlexCol, Heading1, Heading4 } from '@carnegie/duplo'
import { TFunction } from 'i18next'
import { Component, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplicationInsightsContext } from '../../context'
import { TrackException } from '../../context/providers/application-insights-context-provider'
import { ParentFC } from '../../types'
import { ErrorBanner } from '../banners/ErrorBanner'

type Props = {
  children: ReactNode
  t: TFunction<'components'>
  trackException: TrackException
}

type State = {
  hasError: boolean
  error: Error | undefined
}

const initialState = {
  hasError: false,
  error: undefined,
} satisfies State

class ErrorBoundary extends Component<Props, State> {
  public state: State

  constructor(props: Props) {
    super(props)
    this.state = { ...initialState }
  }

  public static getDerivedStateFromError(err: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: err }
  }

  public componentDidCatch(error: Error) {
    console.error('Error caught in boundary', error)
    this.props.trackException(error)
  }

  private reset() {
    window.location.assign('/')
  }

  public render() {
    const { t } = this.props
    const { hasError, error } = this.state

    if (!hasError || !error) {
      return this.props.children
    }

    return (
      <FlexCol gap={32}>
        <Heading1>&#58;&#40;</Heading1>
        <Heading4>{t('errorBoundary.heading')}</Heading4>
        <ErrorBanner debug={window.ENV?.DEBUG} error={error} title={t('errorBoundary.title')} />
        <Button onClick={this.reset} variant="primary" size="medium">
          {t('errorBoundary.reloadButton')}
        </Button>
      </FlexCol>
    )
  }
}

export const FullPageErrorBoundary: ParentFC = ({ children }) => {
  const { t } = useTranslation('components')
  const { trackException } = useApplicationInsightsContext()

  return (
    <ErrorBoundary t={t} trackException={trackException}>
      {children}
    </ErrorBoundary>
  )
}
