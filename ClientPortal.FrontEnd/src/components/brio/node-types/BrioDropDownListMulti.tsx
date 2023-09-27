import { FlexCol, Option, Select } from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInputWithOptions } from '../../../types'
import { arrayOrEmpty, arrayWithValuesOrEmpty } from '../../../utils/trapets/array-oprations'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioDropDownListMulti: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  options = [],
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { control, setValue } = useFormContext()

  useEffect(() => {
    setValue(id, arrayWithValuesOrEmpty(defaultValue))
  }, [id, defaultValue])

  return (
    <Controller
      render={({ field, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} text={text} />
          <Select id={id} clearButton error={!!error} multiple readOnly={readOnly} {...field}>
            {options.map(option => (
              <Option
                key={option.id}
                checked={Array.isArray(field.value) && field.value.includes(option.id)}
                value={option.id}
              >
                {option.text}
              </Option>
            ))}
          </Select>
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={arrayOrEmpty(defaultValue)}
    />
  )
}
