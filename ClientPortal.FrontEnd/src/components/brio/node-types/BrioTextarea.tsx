import { FlexCol, Textarea } from '@carnegie/duplo'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInput } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioTextarea: FC<BrioInput> = ({
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
          <Textarea error={!!error} readOnly={readOnly} required size="medium" {...field} />
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={typeof defaultValue === 'string' ? defaultValue : ''}
    />
  )
}
