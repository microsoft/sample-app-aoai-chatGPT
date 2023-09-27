import { FlexCol, Radio, RadioGroup } from '@carnegie/duplo'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInputWithOptions } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioRadioButtons: FC<BrioInputWithOptions> = ({
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
      render={({ field: { value, ...rest }, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} text={text} />
          <RadioGroup>
            <FlexCol gap={4}>
              {options.map(option => (
                <Radio
                  color={error ? 'status-negative' : undefined}
                  defaultChecked={defaultValue === option.id}
                  disabled={readOnly}
                  error={!!error}
                  key={option.id}
                  label={option.text}
                  required
                  value={option.id}
                  {...rest}
                />
              ))}
            </FlexCol>
          </RadioGroup>
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={defaultValue}
    />
  )
}
