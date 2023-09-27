import { FlexCol, Heading3, Paragraph } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const PandaExitPage: FC = () => {
  const { t } = useTranslation('pages')

  return (
    <FlexCol alignItems="center" gap={32}>
      <Heading3>{t('pandaExitPage.heading')}</Heading3>
      <Paragraph>{t('pandaExitPage.paragraph')}</Paragraph>
    </FlexCol>
  )
}
