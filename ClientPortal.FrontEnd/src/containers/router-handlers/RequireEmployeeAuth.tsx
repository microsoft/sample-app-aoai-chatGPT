import { FC, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { StringParam, useQueryParam } from 'use-query-params'
import { CenteredLoading } from '../../components/defaults/CenteredLoading'
import { useCurity, useUser } from '../../context'
import { useLockedEffect } from '../../hooks/use-locked-effect'
import { getRedirectUri } from '../../utils/get-redirect-uri'

export const RequireEmployeeAuth: FC = () => {
  const { isLoggedIn, ...auth } = useCurity()
  const { isEmployee, reload, ...user } = useUser()
  const [assertion] = useQueryParam('assertion', StringParam)
  const [isAsserting, setIsAsserting] = useState(false)
  const location = useLocation()

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
    throw new Error('Assertion token not found')
  }

  if (error) {
    throw error
  }

  if (!isEmployee) {
    throw new Error('Unauthorized')
  }

  return <Outlet />
}
