import { FlexCol, Radio, RadioGroup } from '@carnegie/duplo'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BrioInputWithOptions } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

// (... as any) -> https://www.i18next.com/overview/typescript#type-error-template-literal

export const BrioRadioButtonsYesNo: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  helpTitle,
  options = [],
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { t } = useTranslation('brio')
  const { control } = useFormContext()

  return (
    <Controller
      render={({ field: { value, ...rest }, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} helpTitle={helpTitle} text={text} />
          <RadioGroup>
            <FlexCol gap={4}>
              {options.map(option => (
                <Radio
                  color={error ? 'status-negative' : undefined}
                  defaultChecked={defaultValue === option.id}
                  disabled={readOnly}
                  error={!!error}
                  key={option.id}
                  label={t(option.text as any) ?? undefined}
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
