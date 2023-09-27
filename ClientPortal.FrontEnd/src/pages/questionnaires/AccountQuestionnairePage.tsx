import { Box, Flex, FlexCol, Heading3, LinkButton, SkeletonRect } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBanner } from '../../components/banners/ErrorBanner'
import { AccountQuestionnaireContainer } from '../../containers/AccountQuestionnaireContainer'
import { useAccountQuestionnaire } from '../../hooks/use-account-questionnaire'

export const AccountQuestionnairePage: FC = () => {
  const { t } = useTranslation(['common', 'pages'])
  const { page, accountStateItem, error, isLoading, onNext, onPrevious } = useAccountQuestionnaire()

  return (
    <FlexCol gap={16}>
      {isLoading ? (
        <Box style={{ height: 20 }} />
      ) : (
        <LinkButton onClick={onPrevious}>&#60; {t('common:nouns.back')}</LinkButton>
      )}
      <Flex justifyContent="center">
        <Heading3>{t('pages:accountPage.heading')}</Heading3>
      </Flex>
      {error && <ErrorBanner debug={window.ENV?.DEBUG} error={error} />}
      {!accountStateItem ? (
        <SkeletonRect height={300} />
      ) : (
        <AccountQuestionnaireContainer
          page={page}
          onNext={onNext}
          isLoading={isLoading}
          accountStateItem={accountStateItem}
        />
      )}
    </FlexCol>
  )
}
