import { FlexCol, Heading3, Heading6, Text } from '@carnegie/duplo'
import { t } from 'i18next'
import { FC, useState } from 'react'
import { Navigate } from 'react-router'
import { ErrorBanner } from '../../components/banners/ErrorBanner'
import { CenteredLoading } from '../../components/defaults/CenteredLoading'
import { LoginButton } from '../../components/login'
import { useCurity, useUser } from '../../context'
import { useBff } from '../../hooks/api/use-bff'
import { useLockedEffect } from '../../hooks/use-locked-effect'
import { isForbiddenError } from '../../utils/is-error'

type Response = {
  success: boolean
  error: string
}

export const SelfOnboarding: FC = () => {
  const bff = useBff()
  const { reload } = useUser()
  const [onboardingSuccess, setOnboardingSuccess] = useState<boolean>(false)
  const [onboardingError, setOnboardingError] = useState<Error>()

  useLockedEffect(
    () =>
      bff
        .get<Response>('/selfonboarding/new')
        .then(({ data: { success, error } }) => {
          setOnboardingSuccess(success)

          if (success) {
            return reload()
          }

          if (error) {
            setOnboardingError(new Error(error))
          }
        })
        .catch(err => setOnboardingError(err)),
    [],
  )

  if (onboardingError?.message === 'ALREADY_CUSTOMER') {
    return <Navigate to="/dashboard" />
  }

  if (onboardingError) {
    return (
      <ErrorBanner
        title={t('errors:statusCode.default.title')}
        description={t('errors:statusCode.default.description')}
      />
    )
  }

  if (onboardingSuccess) {
    return <WelcomePage />
  }

  return <CenteredLoading />
}

export const WelcomePage = () => {
  const { isLoggedIn, login, ...auth } = useCurity()
  const { isEmployee, isCustomer, isProspect, name, reload, error, ...user } = useUser()

  const isLoading = auth.isLoading || user.isLoading

  if (isLoading) {
    return <CenteredLoading />
  }

  const isEligableForOnboarding =
    isLoggedIn &&
    isForbiddenError(error) &&
    !isEmployee &&
    !isCustomer &&
    !isProspect &&
    !name?.length

  if (!isEligableForOnboarding) {
    return <Navigate to="/forbidden" />
  }

  //TODO: se till att använda translations när vi väl har fått detta på plats ordentligt och inte MVP

  return (
    <FlexCol verticalAlign="middle" alignItems="center" gap={16}>
      <Heading3 pb={16}>Välkommen till oss</Heading3>
      <Heading6>
        Du kommer nu loggas in och få frågor om kontaktuppgifter, om dig och ditt sparande.
      </Heading6>
      <Text variant="subtitle2" pb={16}>
        I denna MVP kommer vi tvinga dig att logga in 2 ggr.
        <br /> Denna sida kan få tillägg av information som gäller för dig som kund. T.ex.
        prislistor och vad du kommer få som kund.
      </Text>
      <LoginButton btnText="Gå vidare" onClick={() => login('/dashboard')} />
    </FlexCol>
  )
}
