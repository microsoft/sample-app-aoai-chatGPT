import { Flex, FlexCol, Heading3, Link } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { NumberParam, StringParam, useQueryParams } from 'use-query-params'
import { ErrorBanner } from '../../components/banners/ErrorBanner'
import { IS_DEBUG } from '../../constants'
import { BaseInfoQuestionnaireContainer } from '../../containers/BaseInfoQuestionnaireContainer'
import { BaseInfoReadContainer } from '../../containers/BaseInfoReadContainer'
import { CustomerBannerContainer } from '../../containers/CustomerBannerContainer'
import { QuestionnaireMode } from '../../enums'
import { safelyParse } from '../../utils/safely-parse'

export const PandaBaseInfoQuestionnairePage: FC = () => {
  const { t } = useTranslation(['common', 'pages'])
  const navigate = useNavigate()
  const [query] = useQueryParams({
    customer: NumberParam,
    mode: StringParam,
  })
  const debug = safelyParse(window.ENV?.DEBUG)

  if (!query.customer) {
    return <ErrorBanner error={new Error('Missing customer in query params')} />
  }

  if (query.mode === QuestionnaireMode.View) {
    return (
      <FlexCol gap={16}>
        <Link to="/panda/exit">&#60; {t('common:nouns.back')}</Link>
        <FlexCol alignItems="center" gap={16}>
          <Heading3>{t('pages:baseInfoPage.heading')}</Heading3>
        </FlexCol>
        <CustomerBannerContainer customerId={query.customer} debug={debug} />
        <BaseInfoReadContainer customerId={query.customer} debug={IS_DEBUG} />
      </FlexCol>
    )
  }

  return (
    <FlexCol gap={16}>
      <Flex justifyContent="center">
        <Heading3>{t('pages:baseInfoPage.heading')}</Heading3>
      </Flex>
      <CustomerBannerContainer customerId={query.customer} debug={debug} />
      <BaseInfoQuestionnaireContainer
        customerId={query.customer}
        debug={IS_DEBUG}
        onClose={() => navigate('/panda/exit')}
      />
    </FlexCol>
  )
}
