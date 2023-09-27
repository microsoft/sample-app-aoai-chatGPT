import { Flex, FlexCol, Heading3, Link, Paragraph } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { NumberParam, StringParam, useQueryParams } from 'use-query-params'
import { ContactUsToChangeBanner } from '../../components/banners/ContactUsToChangeBanner'
import { IS_DEBUG } from '../../constants'
import { TrapetsQuestionnaireContainer } from '../../containers/TrapetsQuestionnaireContainer'
import { TrapetsReadContainer } from '../../containers/TrapetsReadContainer'
import { useUser } from '../../context'
import { QuestionnaireMode } from '../../enums'

// (... as any) -> https://www.i18next.com/overview/typescript#type-error-template-literal

export const TrapetsQuestionnairePage: FC = () => {
  const { t } = useTranslation(['common', 'pages'])
  const user = useUser()
  const navigate = useNavigate()
  const [query] = useQueryParams({
    id: NumberParam,
    mode: StringParam,
    reference: StringParam,
  })

  if (!query.id) {
    throw new Error('Missing questionnaire in query params')
  }

  if (!query.reference) {
    throw new Error('Missing reference in query params')
  }

  if (query.mode === QuestionnaireMode.View) {
    return (
      <FlexCol gap={16}>
        <Link to="/">&#60; {t('common:nouns.back')}</Link>
        <FlexCol alignItems="center" gap={16}>
          <Heading3>
            {t([
              `pages:trapetsQuestionnairePage.${query.reference}.heading` as any,
              'pages:trapetsQuestionnairePage.default.heading',
            ])}
          </Heading3>
          <Paragraph>
            {t([
              `pages:trapetsQuestionnairePage.${query.reference}.paragraph` as any,
              'pages:trapetsQuestionnairePage.default.paragraph',
            ])}
          </Paragraph>
        </FlexCol>
        <ContactUsToChangeBanner />
        <TrapetsReadContainer customerId={user.id} debug={IS_DEBUG} questionnaireId={query.id} />
      </FlexCol>
    )
  }

  return (
    <FlexCol gap={16}>
      <Flex justifyContent="center">
        <Heading3>
          {t([
            `pages:trapetsQuestionnairePage.${query.reference}.heading` as any,
            'pages:trapetsQuestionnairePage.default.heading',
          ])}
        </Heading3>
      </Flex>
      <TrapetsQuestionnaireContainer
        questionnaireId={query.id}
        customerId={user.id}
        reference={query.reference}
        onClose={() => navigate('/dashboard')}
      />
    </FlexCol>
  )
}
