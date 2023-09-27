import { ButtonSwitch, FlexCol } from '@carnegie/duplo'
import { FC, useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BrioInputWithOptions } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

// (... as any) -> https://www.i18next.com/overview/typescript#type-error-template-literal

export const BrioButtonSwitchYesNo: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  options: nodeOptions = [],
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { t } = useTranslation('brio')

  const options = nodeOptions.map(x => ({ label: t(x.text as any), value: x.id }))
  const { control, clearErrors, setValue } = useFormContext()
  const [option, setOption] = useState<string | undefined>(defaultValue as string)

  useEffect(() => setValue(id, option), [id, option])

  return (
    <Controller
      render={({ field, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} text={text} />
          <ButtonSwitch
            disabled={readOnly}
            error={!!error}
            size="medium"
            options={options}
            value={option}
            onChange={value => {
              clearErrors(id)
              setOption(value)
            }}
          />
          <input type="hidden" {...field} />
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={option}
    />
  )
}
