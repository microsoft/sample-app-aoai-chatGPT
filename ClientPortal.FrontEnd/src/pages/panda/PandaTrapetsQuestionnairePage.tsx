import { Flex, FlexCol, Heading3, Link, Paragraph } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { NumberParam, StringParam, useQueryParams } from 'use-query-params'
import { IS_DEBUG } from '../../constants'
import { CustomerBannerContainer } from '../../containers/CustomerBannerContainer'
import { TrapetsQuestionnaireContainer } from '../../containers/TrapetsQuestionnaireContainer'
import { TrapetsReadContainer } from '../../containers/TrapetsReadContainer'
import { QuestionnaireMode } from '../../enums'
import { safelyParse } from '../../utils/safely-parse'

// (... as any) -> https://www.i18next.com/overview/typescript#type-error-template-literal

export const PandaTrapetsQuestionnairePage: FC = () => {
  const { t } = useTranslation(['common', 'pages'])
  const navigate = useNavigate()
  const [query] = useQueryParams({
    id: NumberParam,
    customer: NumberParam,
    mode: StringParam,
    reference: StringParam,
  })
  const debug = safelyParse(window.ENV?.DEBUG)

  if (!query.id) {
    throw new Error('Missing questionnaire in query params')
  }
  if (!query.customer) {
    throw new Error('Missing customer in query params')
  }
  if (!query.reference) {
    throw new Error('Missing reference in query params')
  }

  if (query.mode === QuestionnaireMode.View) {
    return (
      <FlexCol gap={16}>
        <Link to="/panda/exit">&#60; {t('common:nouns.back')}</Link>
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
        <CustomerBannerContainer customerId={query.customer} debug={debug} />
        <TrapetsReadContainer
          customerId={query.customer}
          debug={IS_DEBUG}
          questionnaireId={query.id}
        />
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
      <CustomerBannerContainer customerId={query.customer} debug={debug} />
      <TrapetsQuestionnaireContainer
        customerId={query.customer}
        debug={IS_DEBUG}
        questionnaireId={query.id}
        reference={query.reference}
        onClose={() => navigate('/panda/exit')}
      />
    </FlexCol>
  )
}
