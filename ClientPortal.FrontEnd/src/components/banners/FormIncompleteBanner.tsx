import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const FormIncompleteBanner: FC = () => {
  const { t } = useTranslation('banners')

  return (
    <Banner severity="critical" title={t('formIncompleteBanner.title')}>
      {t('formIncompleteBanner.content')}
    </Banner>
  )
}
