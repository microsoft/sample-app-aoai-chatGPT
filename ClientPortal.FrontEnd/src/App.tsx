import { FC, Suspense } from 'react'
import { CenteredGrid } from './components/defaults/CenteredGrid'
import { CenteredLoading } from './components/defaults/CenteredLoading'
import { FullPageErrorBoundary } from './components/defaults/FullPageErrorBoundary'
import { CarnegieHeaderContainer } from './containers/CarnegieHeaderContainer'
import { AppContextProviders } from './context/app/app-context-providers'
import { Router } from './pages/PageRouter'

export const App: FC = () => (
  <AppContextProviders>
    <CarnegieHeaderContainer />
    <CenteredGrid>
      <FullPageErrorBoundary>
        <Suspense fallback={<CenteredLoading />}>
          <Router />
        </Suspense>
      </FullPageErrorBoundary>
    </CenteredGrid>
  </AppContextProviders>
)
