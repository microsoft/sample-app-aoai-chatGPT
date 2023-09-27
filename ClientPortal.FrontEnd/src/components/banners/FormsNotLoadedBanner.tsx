import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const FormsNotLoadedBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="warning" title={t('formsNotLoadedBanner.title')}>
      {t('formsNotLoadedBanner.content')}
    </Banner>
  )
}
