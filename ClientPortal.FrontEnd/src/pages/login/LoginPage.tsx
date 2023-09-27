import { Flex, FlexCol } from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { StringParam, useQueryParam } from 'use-query-params'
import { ErrorBanner } from '../../components/banners/ErrorBanner'
import { LoginButton } from '../../components/login'
import { LoginFooter } from '../../components/login/LoginFooter'
import { LoginHeader } from '../../components/login/LoginHeader'
import { LoginInfoList } from '../../components/login/LoginInfoList'
import { LanguageSwitchContainer } from '../../containers/LanguageSwitchContainer'
import { useCurity } from '../../context'
import { safelyParse } from '../../utils/safely-parse'

export const LoginPage: FC = () => {
  const { t } = useTranslation(['common', 'pages'])
  const { error, isLoggedIn, login, logout } = useCurity()
  const [errorCode] = useQueryParam('error_code', StringParam)
  const location = useLocation()

  const redirectUri = location.state?.from?.pathname
    ? location.state.from.pathname + location.state.from.search
    : undefined

  useEffect(() => {
    if (!isLoggedIn) return
    if (errorCode !== 'unauthorized') return

    logout()
  }, [errorCode])

  return (
    <FlexCol gap={16}>
      <LoginHeader title={t('pages:loginPage.title')} subtitle={t('pages:loginPage.subHeading')} />
      <LoginInfoList
        items={[t('pages:loginPage.step1'), t('pages:loginPage.step2'), t('pages:loginPage.step3')]}
      />
      <Flex pb={8} pt={8}>
        <LoginButton btnText={t('pages:loginPage.cta')} onClick={() => login(redirectUri)} />
      </Flex>
      <LoginFooter />
      {safelyParse(window.ENV?.USE_TRANSLATIONS) === true && <LanguageSwitchContainer />}
      {error && <ErrorBanner debug={window.ENV?.DEBUG} error={error} />}
    </FlexCol>
  )
}
