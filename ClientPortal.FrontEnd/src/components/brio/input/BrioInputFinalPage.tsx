import { FlexCol, Segment, Text } from '@carnegie/duplo'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CenteredLoading } from '../../defaults/CenteredLoading'
import { FormItem, FormList } from '../../form-list/FormList'
import { BrioReturn } from '../navigation/BrioReturn'
import { QuestionnaireItemOrigin } from '../../../enums'

type Props = {
  displayButton?: boolean
  displayButtonMs?: number
  forms?: FormItem[]
  intervalMs?: number
  intervalTimeoutMs?: number
  onClose(): void
  onInterval(): void
}

export const BrioInputFinalPage: FC<Props> = ({
  displayButton = false,
  displayButtonMs = 10000,
  forms = [],
  intervalMs = 4000,
  intervalTimeoutMs = 30000,
  onClose,
  onInterval,
}) => {
  const { t } = useTranslation('brio')
  const [display, setDisplay] = useState(displayButton)

  useEffect(() => {
    const timeout = setTimeout(() => setDisplay(true), displayButtonMs)
    return () => clearTimeout(timeout)
  }, [displayButtonMs])

  useEffect(() => {
    const interval = setInterval(() => onInterval(), intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])

  useEffect(() => {
    const timeout = setTimeout(() => onClose(), intervalTimeoutMs)
    return () => clearTimeout(timeout)
  }, [intervalTimeoutMs])

  return (
    <FlexCol gap={16}>
      <Segment>
        <FlexCol alignItems="center">
          <Text variant="body1" color="text-low-emphasis" pt={16}>
            {t('finalPage.thankYou')}
          </Text>
          <Text variant="subtitle1" pt={8} pb={32}>
            {t('finalPage.checkingAnswers')}
          </Text>
          <CenteredLoading />
          <Text variant="body1" color="text-low-emphasis" pt={32} pb={16}>
            {forms?.length > 0 && forms[0].origin === QuestionnaireItemOrigin.ClientInformation ? t('finalPage.forwardManually') : t('finalPage.forwardingSoon')}
          </Text>
          {display && <BrioReturn onClick={onClose} />}
        </FlexCol>
      </Segment>
      {!!forms.length && <FormList forms={forms} />}
    </FlexCol>
  )
}
