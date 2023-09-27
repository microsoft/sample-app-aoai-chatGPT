import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const ContactUsToChangeBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="information" title={t('contactUsToChangeBanner.title')}>
      {t('contactUsToChangeBanner.content')}
    </Banner>
  )
}
