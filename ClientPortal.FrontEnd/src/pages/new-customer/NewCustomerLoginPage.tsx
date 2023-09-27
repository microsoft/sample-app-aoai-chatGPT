import { Flex, FlexCol } from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StringParam, useQueryParam } from 'use-query-params'
import { ErrorBanner } from '../../components/banners/ErrorBanner'
import { LoginButton } from '../../components/login'
import { LoginFooter } from '../../components/login/LoginFooter'
import { LoginHeader } from '../../components/login/LoginHeader'
import { LoginInfoList } from '../../components/login/LoginInfoList'
import { LanguageSwitchContainer } from '../../containers/LanguageSwitchContainer'
import { useCurity } from '../../context'
import { safelyParse } from '../../utils/safely-parse'

export const NewCustomerLoginPage: FC = () => {
  const { t } = useTranslation(['common', 'pages'])
  const { error, isLoggedIn, login, logout } = useCurity()
  const [errorCode] = useQueryParam('error_code', StringParam)

  const redirectUri = '/new-customer/self-onboarding'

  useEffect(() => {
    if (!isLoggedIn) return
    if (errorCode !== 'unauthorized') return

    logout()
  }, [errorCode])

  return (
    <FlexCol gap={16}>
      <LoginHeader
        title={t('pages:onboardingPage.title')}
        subtitle={t('pages:onboardingPage.subHeading')}
      />
      <LoginInfoList
        items={[
          t('pages:onboardingPage.step1'),
          t('pages:onboardingPage.step2'),
          t('pages:onboardingPage.step3'),
          t('pages:onboardingPage.step4'),
        ]}
      />
      <Flex pb={8} pt={8}>
        <LoginButton btnText={t('pages:onboardingPage.cta')} onClick={() => login(redirectUri)} />
      </Flex>
      <LoginFooter />
      {safelyParse(window.ENV?.USE_TRANSLATIONS) === true && <LanguageSwitchContainer />}
      {error && <ErrorBanner debug={window.ENV?.DEBUG} error={error} />}
    </FlexCol>
  )
}
