import { FlexCol, Option, Select } from '@carnegie/duplo'
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BrioInputWithOptions } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

// (... as any) -> https://www.i18next.com/overview/typescript#type-error-template-literal

export const BrioDropDownListYesNo: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  options = [],
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { t } = useTranslation('brio')
  const { control } = useFormContext()

  return (
    <Controller
      render={({ field, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} text={text} />
          <Select id={id} error={!!error} readOnly={readOnly} {...field}>
            {options.map(option => (
              <Option key={option.id} value={option.id}>
                {t(option.text as any) ?? undefined}
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
