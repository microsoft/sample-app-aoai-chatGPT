import { FlexCol, FlexRow, IconButton, IconInfoOutlined, SideDrawer, Text } from '@carnegie/duplo'
import { FC, useState } from 'react'
import { FieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

type Props = {
  error?: Error | FieldError
  helpText?: React.ReactNode | null
  helpTitle?: React.ReactNode
  text?: string | null
}

export const BrioInputLabel: FC<Props> = ({ error, helpText, helpTitle, text }) => {
  const { t } = useTranslation('brio')
  const [open, setOpen] = useState<boolean>(false)
  const color = error ? 'status-negative' : undefined

  if (!text) return <></>

  return (
    <>
      <FlexCol gap={8} mb={4}>
        <FlexRow minHeight={24} alignItems="flex-start" justifyContent="space-between">
          {text && (
            <Text color={color} variant="subtitle1">
              {text}
            </Text>
          )}
          {helpText && (
            <IconButton
              icon={IconInfoOutlined}
              color={'icon-default'}
              onClick={() => setOpen(true)}
              size="small"
              variant="uncontained"
              minWidth={24}
            />
          )}
        </FlexRow>
      </FlexCol>
      {helpText && (
        <SideDrawer
          title={helpTitle ?? t('helpDrawer.title')}
          variant="slide"
          sidebarContent={helpText}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
