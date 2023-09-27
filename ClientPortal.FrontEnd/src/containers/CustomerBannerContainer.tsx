import { SkeletonRect } from '@carnegie/duplo'
import { FC } from 'react'
import { CustomerBanner } from '../components/banners/CustomerBanner'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { usePerson } from '../hooks/react-query/use-person'

type Props = {
  customerId: number
  debug?: boolean
}

export const CustomerBannerContainer: FC<Props> = ({ customerId, debug = false }) => {
  const { data, error, isLoading } = usePerson(customerId)

  if (isLoading) {
    return <SkeletonRect height={150} />
  }

  if (error) {
    return <ErrorBanner debug={debug} error={error} />
  }

  if (!data) {
    return <ErrorBanner error={new Error('Customer missing')} />
  }

  return (
    <CustomerBanner
      email={data.emails.find(x => x.isPreferred)?.email}
      familyName={data.surName}
      givenName={data.firstName}
      nationalIdentityNumber={
        data.identifications.find(x => x.type === 'NationalIdRegNo')?.identifier
      }
      phone={data.phoneNumbers.find(x => x.isPreferred)?.number}
    />
  )
}
