import { Autocomplete, AutocompleteOption, FlexCol } from '@carnegie/duplo'
import { FC, useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BrioInputWithOptions } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioAutocomplete: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  helpTitle,
  options: nodeOptions = [],
  readOnly,
  text,
  value: defaultValue,
}) => {
  const options = nodeOptions.map(x => ({ label: x.text, value: x.id }))

  const { control, clearErrors, setValue } = useFormContext()
  const [option, setOption] = useState<AutocompleteOption | undefined>(
    defaultValue ? options.find(x => x.value === defaultValue) : undefined,
  )

  useEffect(() => setValue(id, option?.value), [id, option])

  return (
    <Controller
      render={({ field: { onChange: _1, value, ...rest }, fieldState: { error } }) => (
        <FlexCol>
          <BrioInputLabel error={error} helpText={helpText} helpTitle={helpTitle} text={text} />
          <Autocomplete
            id={id}
            error={!!error}
            readOnly={readOnly}
            value={option}
            options={options}
            onChange={(_2, change) => {
              clearErrors(id)
              setOption(options.find(x => x.value === change))
            }}
            {...rest}
          />
          <BrioInputError error={error} />
        </FlexCol>
      )}
      name={id}
      control={control}
      defaultValue={option}
    />
  )
}
