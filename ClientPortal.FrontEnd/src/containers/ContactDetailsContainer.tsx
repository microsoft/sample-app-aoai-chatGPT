import { FlexRow, SkeletonRect } from '@carnegie/duplo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FC, useState } from 'react'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { ContactDetailsCard } from '../components/contact-details/ContactDetailsCard'
import {
  ContactDetails,
  ContactDetailsDrawer,
} from '../components/contact-details/ContactDetailsDrawer'
import { useBff } from '../hooks/api/use-bff'
import { usePerson } from '../hooks/react-query/use-person'

type Props = {
  customerId: number
  debug?: boolean
}

export const ContactDetailsContainer: FC<Props> = ({ customerId, debug = false }) => {
  const bff = useBff()
  const [open, setOpen] = useState<boolean>(false)
  const [mutateError, setMutateError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(false)
  const { isLoading, data, error } = usePerson(customerId)
  const queryClient = useQueryClient()

  const mutation = useMutation<ContactDetails, Error, ContactDetails>(
    body => bff.put(`/persons/${customerId}/contact-details`, body),
    {
      onMutate: () => {
        setLoading(true)
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['use-person'])
        setOpen(false)
      },
      onError: err => {
        setMutateError(err)
      },
      onSettled: () => {
        setLoading(false)
      },
    },
  )

  const onClose = () => {
    setOpen(false)
    setMutateError(undefined)
  }

  const email = data?.emails.find(x => x.isPreferred)?.email
  const phoneNumber = data?.phoneNumbers.find(x => x.isPreferred)?.number

  if (isLoading) {
    return <SkeletonRect height={130} width="full" />
  }

  if (error) {
    return <ErrorBanner debug={debug} error={error} />
  }

  return (
    <FlexRow>
      <ContactDetailsCard email={email} phoneNumber={phoneNumber} onClick={() => setOpen(true)} />
      <ContactDetailsDrawer
        debug={debug}
        email={email}
        error={mutateError}
        loading={loading}
        open={open}
        phoneNumber={phoneNumber}
        onClose={onClose}
        onSave={mutation.mutate}
      />
    </FlexRow>
  )
}
