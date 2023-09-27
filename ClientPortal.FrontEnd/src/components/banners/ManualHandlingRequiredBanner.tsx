import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const ManualHandlingRequiredBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="warning" title={t('manualHandlingRequiredBanner.title')}>
      {t('manualHandlingRequiredBanner.content')}
    </Banner>
  )
}
