import { FlexCol, Input } from '@carnegie/duplo'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInput } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioTextBox: FC<BrioInput> = ({
  id,
  helpText,
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { control } = useFormContext()

  return (
    <Controller
      render={({ field, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} text={text} />
          <Input error={!!error} readOnly={readOnly} required type="text" {...field} />
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={typeof defaultValue === 'string' ? defaultValue : ''}
    />
  )
}
