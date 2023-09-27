import { Checkbox, FlexCol } from '@carnegie/duplo'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInput } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'

export const BrioCheckbox: FC<BrioInput> = ({ id, readOnly, text, value: defaultValue }) => {
  const { control } = useFormContext()

  return (
    <Controller
      render={({ field, fieldState: { error } }) => (
        <FlexCol>
          <Checkbox
            id={id}
            color={error ? 'status-negative' : undefined}
            defaultChecked={!!defaultValue}
            disabled={readOnly}
            error={!!error}
            label={text}
            {...field}
            onBlur={() => null}
          />
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={defaultValue}
    />
  )
}
