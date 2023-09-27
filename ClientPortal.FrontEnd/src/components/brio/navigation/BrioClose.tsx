import { Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplicationInsightsContext } from '../../../context'

type Props = {
  disabled?: boolean
  hidden?: boolean
  onClick(): void
}

export const BrioClose: FC<Props> = ({ disabled = false, hidden = false, onClick }) => {
  const { t } = useTranslation('brio')
  const { trackEvent } = useApplicationInsightsContext()

  if (disabled || hidden) {
    return <></>
  }

  return (
    <Text
      color="astral"
      variant="support1"
      pr={4}
      onClick={() => {
        trackEvent('closeBtn', { url: window.location.href })
        onClick()
      }}
      css={{
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      {t(`#Close#`)}
    </Text>
  )
}
