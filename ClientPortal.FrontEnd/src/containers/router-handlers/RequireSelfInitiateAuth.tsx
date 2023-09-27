import queryString from 'query-string'
import { FC, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { StringParam, useQueryParam } from 'use-query-params'
import { CenteredLoading } from '../../components/defaults/CenteredLoading'
import { useCurity, useUser } from '../../context'
import { useLockedEffect } from '../../hooks/use-locked-effect'
import { getRedirectUri } from '../../utils/get-redirect-uri'
import { isForbiddenError, isUnauthorizedError, isUnknownNetworkError } from '../../utils/is-error'

export const RequireSelfInitiateAuth: FC = () => {
  const { isLoggedIn, ...auth } = useCurity()
  const { isCustomer, reload, isProspect, ...user } = useUser()
  const [assertion] = useQueryParam('assertion', StringParam)
  const location = useLocation()
  const [isAsserting, setIsAsserting] = useState(false)
  const isLoading = auth.isLoading || user.isLoading
  const error = auth.error || user.error

  useLockedEffect(async () => {
    if (!assertion) return
    if (auth.error) return

    setIsAsserting(true)

    await auth.handleAssertionToken(assertion, getRedirectUri(location))
    await reload()

    setIsAsserting(false)
  }, [assertion, isLoading])

  if (assertion && !auth.error) {
    return <CenteredLoading />
  }

  if (isLoading || isAsserting) {
    return <CenteredLoading />
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to={{ pathname: '/login', search: queryString.stringify({ error_code: 'not_logged_in' }) }}
        state={{ from: location }}
        replace
      />
    )
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

  if ((!isCustomer && !isProspect) || isForbiddenError(error) || isUnknownNetworkError(error)) {
    return <Navigate to={{ pathname: '/forbidden' }} replace />
  }

  if (error) {
    throw error
  }

  return <Outlet />
}
