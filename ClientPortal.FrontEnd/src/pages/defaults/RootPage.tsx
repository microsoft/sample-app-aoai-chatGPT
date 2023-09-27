import queryString from 'query-string'
import { FC } from 'react'
import { Navigate, useLocation } from 'react-router'
import { CenteredLoading } from '../../components/defaults/CenteredLoading'
import { useCurity, useUser } from '../../context'
import { isForbiddenError, isUnauthorizedError, isUnknownNetworkError } from '../../utils/is-error'

export const RootPage: FC = () => {
  const { isLoggedIn, ...auth } = useCurity()
  const { isEmployee, isCustomer, isProspect, name, ...user } = useUser()
  const location = useLocation()

  const isLoading = auth.isLoading || user.isLoading
  const error = auth.error || user.error

  if (isLoading) {
    return <CenteredLoading />
  }

  if (!isLoggedIn) {
    return <Navigate to={{ pathname: '/login' }} replace />
  }

  if (isUnauthorizedError(error)) {
    return (
      <Navigate
        to={{ pathname: '/login', search: queryString.stringify({ error_code: 'unauthorized' }) }}
        state={{ from: location }}
        replace
      />
    )
  }

  //TODO: isUnknownNetworkError borde inte behöva existera, men vi har CORS-problem på 403. Behöver lösas

  if (isForbiddenError(error) || isUnknownNetworkError(error)) {
    return <Navigate to={{ pathname: '/forbidden' }} replace />
  }

  if (error) {
    throw error
  }

  if (isEmployee) {
    return <Navigate to={{ pathname: '/panda/exit' }} replace />
  }

  return <Navigate to={{ pathname: '/dashboard' }} replace />
}
