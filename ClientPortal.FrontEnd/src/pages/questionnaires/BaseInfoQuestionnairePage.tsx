import { Flex, FlexCol, Heading3, Link } from '@carnegie/duplo'
import { FC, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { StringParam, useQueryParams } from 'use-query-params'
import { ContactUsToChangeBanner } from '../../components/banners/ContactUsToChangeBanner'
import { IS_DEBUG } from '../../constants/is-debug'
import { BaseInfoQuestionnaireContainer } from '../../containers/BaseInfoQuestionnaireContainer'
import { BaseInfoReadContainer } from '../../containers/BaseInfoReadContainer'
import { useUser } from '../../context'
import { QuestionnaireMode } from '../../enums'
import { useAudit } from '../../hooks/use-audit'

export const BaseInfoQuestionnairePage: FC = () => {
  const { t } = useTranslation(['common', 'pages'])
  const { auditEvent } = useAudit()
  const user = useUser()
  const navigate = useNavigate()
  const audited = useRef<boolean>(false)
  const [query] = useQueryParams({
    mode: StringParam,
  })

  useEffect(() => {
    if (audited.current) return
    auditEvent('Person', 'Read', user.id)
    audited.current = true
  }, [audited, user.id, auditEvent])

  if (query.mode === QuestionnaireMode.View) {
    return (
      <FlexCol gap={16}>
        <Link to="/">&#60; {t('common:nouns.back')}</Link>
        <FlexCol alignItems="center" gap={16}>
          <Heading3>{t('pages:baseInfoPage.heading')}</Heading3>
        </FlexCol>
        <ContactUsToChangeBanner />
        <BaseInfoReadContainer customerId={user.id} debug={IS_DEBUG} />
      </FlexCol>
    )
  }

  return (
    <FlexCol gap={16}>
      <Flex justifyContent="center">
        <Heading3>{t('pages:baseInfoPage.heading')}</Heading3>
      </Flex>
      <BaseInfoQuestionnaireContainer
        customerId={user.id}
        debug={IS_DEBUG}
        onClose={() => navigate('/dashboard')}
      />
    </FlexCol>
  )
}
