import { FlexCol, Input, InputProps } from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInput, BrioNode } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

type Props = BrioInput & Pick<InputProps, 'min'> & Partial<Pick<BrioNode, 'nodeType'>>

export const BrioNumber: FC<Props> = ({
  id,
  helpText,
  min,
  nodeType = 'Decimal',
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { control, setValue } = useFormContext()

  useEffect(() => {
    setValue(id, defaultValue || 0)
  }, [id, defaultValue])

  return (
    <Controller
      render={({ field: { value, onChange, ...rest }, fieldState: { error } }) => {
        return (
          <FlexCol>
            <BrioInputLabel error={error} helpText={helpText} text={text} />
            <Input
              error={!!error}
              inputMode={nodeType === 'Decimal' ? 'decimal' : 'numeric'}
              onChange={evt => onChange(+evt.target.value)}
              readOnly={readOnly}
              required
              type="number"
              value={value === 0 ? '' : value}
              {...rest}
            />
            <BrioInputError error={error} />
          </FlexCol>
        )
      }}
      name={id}
      control={control}
      defaultValue={typeof defaultValue === 'number' ? defaultValue : 0}
      rules={{ min, required: !!min }}
    />
  )
}
