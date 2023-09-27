import {
  Autocomplete,
  AutocompleteOption,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  IconClear,
  IconPlus,
} from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BrioInputWithOptions } from '../../../types'
import { BrioInputError } from '../input/BrioInputError'
import { BrioInputLabel } from '../input/BrioInputLabel'

const filterOptions = (
  options: AutocompleteOption[],
  values: string[],
  idx: number,
): AutocompleteOption[] =>
  options.filter(x => x.value === values[idx] || !values.includes(x.value as string))

export const BrioDropDownListAddMore: FC<BrioInputWithOptions> = ({
  id,
  helpText,
  options: nodeOptions = [],
  readOnly,
  text,
  value: defaultValue,
}) => {
  const { t } = useTranslation('brio')
  const { control, clearErrors, setValue, watch } = useFormContext()
  const subscription = watch(id)

  const options = nodeOptions.map(x => ({ label: x.text, value: x.id }))

  useEffect(() => {
    if (Array.isArray(subscription) && subscription.length) return

    /**
     * By adding array with empty string on default we can ensure that the
     * render function will loop at least once when creating the node
     */
    setValue(id, Array.isArray(defaultValue) && !!defaultValue.length ? defaultValue : [''])
  }, [id, defaultValue, subscription])

  const onChange = (values: string[], change: string, idx: number) => {
    clearErrors(id)
    values[idx] = change
    setValue(id, values)
  }

  const onAdd = (values: string[]) => {
    clearErrors(id)
    values.push('')
    setValue(id, values)
  }

  const onClear = (values: string[], idx: number) => {
    clearErrors(id)
    values.splice(idx, 1)
    setValue(id, values)
  }

  return (
    <Controller
      name={id}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { onChange: _1, value: values, ...rest }, fieldState: { error } }) => (
        <Box>
          <BrioInputLabel error={error} helpText={helpText} text={text} />
          {Array.isArray(values) &&
            values.map((v, index) => (
              <Flex key={v}>
                <Autocomplete
                  id={id}
                  error={!!error}
                  onChange={(_2, change) => onChange(values, change as string, index)}
                  options={filterOptions(options, values, index)}
                  pb={8}
                  readOnly={readOnly}
                  value={v}
                  {...rest}
                />
                <IconButton
                  disabled={readOnly}
                  icon={IconClear}
                  ml={8}
                  mt={4}
                  onClick={() => onClear(values, index)}
                  size="medium"
                  variant="uncontained"
                />
              </Flex>
            ))}
          {Array.isArray(values) && (
            <Button
              disabled={readOnly}
              startIcon={<Icon icon={IconPlus} />}
              variant="tertiary"
              size="small"
              onClick={() => onAdd(values)}
            >
              {t('#AddMore#')}
            </Button>
          )}
          <BrioInputError error={error} />
        </Box>
      )}
    />
  )
}
