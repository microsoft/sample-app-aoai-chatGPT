import { Checkbox, FlexCol } from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInputWithOptions } from '../../../types'
import { arrayWithValuesOrEmpty } from '../../../utils/trapets/array-oprations'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioCheckboxMulti: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  options = [],
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { control, clearErrors, setValue, watch } = useFormContext()
  const subscription = watch(id)

  useEffect(() => {
    setValue(id, arrayWithValuesOrEmpty(defaultValue))
  }, [id, defaultValue])

  return (
    <Controller
      render={({ field, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} text={text} />
          {options.map(option => (
            <Checkbox
              id={option.id}
              color={error ? 'status-negative' : undefined}
              disabled={readOnly}
              error={!!error}
              key={option.id}
              label={option.text}
              {...field}
              checked={Array.isArray(subscription) ? subscription.includes(option.id) : false}
              onChange={evt => {
                clearErrors(id)
                setValue(
                  id,
                  evt.target.checked
                    ? [...(subscription || []), option.id]
                    : subscription.filter((x: string) => x !== option.id),
                )
              }}
              onBlur={() => null}
            />
          ))}
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
    />
  )
}
