import { Banner, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  email?: string
  familyName?: string
  givenName?: string
  nationalIdentityNumber?: string
  phone?: string
}

export const CustomerBanner: FC<Props> = ({
  email,
  familyName,
  givenName,
  nationalIdentityNumber,
  phone,
}) => {
  const { t } = useTranslation('banners')

  const name = familyName ? `${givenName} ${familyName}` : givenName
  const nin =
    nationalIdentityNumber?.length === 12
      ? `${nationalIdentityNumber.slice(0, 8)}-${nationalIdentityNumber.slice(8)}`
      : nationalIdentityNumber

  return (
    <Banner severity="information" title={t('customerBanner.title', { name })}>
      {nin && <Text>{nin}</Text>}
      {email && <a href={`mailto:${email}`}>{email}</a>}
      {phone && <Text>{phone}</Text>}
    </Banner>
  )
}
