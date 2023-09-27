import { FlexCol, Option, Select } from '@carnegie/duplo'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInputWithOptions, BrioNodeOption } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioSelect: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  options = [],
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
          <Select id={id} error={!!error} readOnly={readOnly} {...field}>
            {options.map((option: BrioNodeOption) => (
              <Option key={option.id} value={option.id}>
                {option.text}
              </Option>
            ))}
          </Select>
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={defaultValue || ''}
    />
  )
}
