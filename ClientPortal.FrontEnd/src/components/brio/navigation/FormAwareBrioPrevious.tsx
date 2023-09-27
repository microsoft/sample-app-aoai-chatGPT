import { FC } from 'react'
import { FieldValues, useFormContext } from 'react-hook-form'
import { BrioPrevious, BrioPreviousProps } from './BrioPrevious'

type Props = Omit<BrioPreviousProps, 'onClick'> & { onClick(fieldValues: FieldValues): void }

export const FormAwareBrioPrevious: FC<Props> = ({ disabled, hidden, loading, onClick }) => {
  const { watch } = useFormContext()
  const subscription = watch()

  return (
    <BrioPrevious
      disabled={disabled}
      hidden={hidden}
      loading={loading}
      onClick={() => onClick(subscription)}
    />
  )
}
