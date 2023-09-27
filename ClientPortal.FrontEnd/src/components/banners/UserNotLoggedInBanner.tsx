import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const UserNotLoggedInBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="warning" title={t('userNotLoggedInBanner.title')}>
      {t('userNotLoggedInBanner.content')}
    </Banner>
  )
}
