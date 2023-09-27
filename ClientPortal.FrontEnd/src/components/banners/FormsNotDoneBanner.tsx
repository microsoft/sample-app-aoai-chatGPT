import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const FormsNotDoneBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="information" title={t('formsNotDoneBanner.title')}>
      {t('formsNotDoneBanner.content')}
    </Banner>
  )
}
