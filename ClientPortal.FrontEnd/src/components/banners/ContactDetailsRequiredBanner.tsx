import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const ContactDetailsRequiredBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="information" title={t('contactDetailsRequiredBanner.title')}>
      {t('contactDetailsRequiredBanner.content')}
    </Banner>
  )
}
