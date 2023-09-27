import { FlexCol, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { FieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

type Props = {
  error?: Error | FieldError
}

export const BrioInputError: FC<Props> = ({ error }) => {
  const { t } = useTranslation('errors', { keyPrefix: 'trapets' })

  if (!error) return <></>

  const message = error.message?.startsWith('#') ? t(error.message as any) : error.message

  return (
    <FlexCol mt={4}>
      <Text color="status-negative" variant="support2">
        {message}
      </Text>
    </FlexCol>
  )
}
