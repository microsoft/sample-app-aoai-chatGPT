import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const FormsCreatingBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="information" title={t('formsCreatingBanner.title')}>
      {t('formsCreatingBanner.content')}
    </Banner>
  )
}
