import { Banner } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  isProspect?: boolean
}

type CustomerType = 'customer' | 'prospect'

export const AllFormsDoneBanner: FC<Props> = ({ isProspect = false }) => {
  const { t } = useTranslation('banners')

  const customerType: CustomerType = isProspect ? 'prospect' : 'customer'

  return (
    <Banner severity="success" title={t(`allFormsDoneBanner.${customerType}.title`)}>
      {t(`allFormsDoneBanner.${customerType}.content`)}
    </Banner>
  )
}
