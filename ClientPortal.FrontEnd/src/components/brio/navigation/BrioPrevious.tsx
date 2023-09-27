import { IconButton, IconChevronLeft } from '@carnegie/duplo'
import { FC } from 'react'
import { useApplicationInsightsContext } from '../../../context'

export type BrioPreviousProps = {
  disabled?: boolean
  hidden?: boolean
  loading?: boolean
  onClick(): void
}

export const BrioPrevious: FC<BrioPreviousProps> = ({
  disabled = false,
  hidden = false,
  loading = false,
  onClick,
}) => {
  const { trackEvent } = useApplicationInsightsContext()

  if (hidden) {
    return <></>
  }

  return (
    <IconButton
      disabled={disabled}
      loading={loading}
      onClick={() => {
        trackEvent('prevPageBtn', { url: window.location.href })
        onClick()
      }}
      variant="uncontained"
      size="medium"
      icon={IconChevronLeft}
    />
  )
}
