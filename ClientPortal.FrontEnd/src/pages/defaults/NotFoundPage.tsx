import { Button, FlexCol, Heading3, Icon, IconCompass, Segment, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

export const NotFoundPage: FC = () => {
  const { t } = useTranslation('pages')
  const navigate = useNavigate()

  return (
    <FlexCol gap={24}>
      <FlexCol alignItems="center">
        <Heading3>{t('notFoundPage.heading1')}</Heading3>
        <Heading3>{t('notFoundPage.heading2')}</Heading3>
      </FlexCol>
      <Segment>
        <FlexCol alignItems="center" gap={24}>
          <Icon size={64} icon={IconCompass} />
          <FlexCol alignItems="center">
            <Text variant="label1">{t('notFoundPage.paragraph1')}</Text>
            <Text variant="subtitle2">{t('notFoundPage.paragraph2')}</Text>
          </FlexCol>
          <Button variant="primary" size="medium" width="full" onClick={() => navigate('/')}>
            {t('notFoundPage.button')}
          </Button>
        </FlexCol>
      </Segment>
    </FlexCol>
  )
}
