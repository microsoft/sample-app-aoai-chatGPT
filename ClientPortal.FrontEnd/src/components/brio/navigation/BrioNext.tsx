import { Button, ButtonIcon, IconChevronRight } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplicationInsightsContext } from '../../../context'
import { BrioNavigationText } from '../../../types'

type Props = {
  disabled?: boolean
  hidden?: boolean
  loading?: boolean
  text?: BrioNavigationText
}

// (... as any) -> https://www.i18next.com/overview/typescript#type-error-template-literal

export const BrioNext: FC<Props> = ({
  disabled = false,
  hidden = false,
  loading = false,
  text = '#DefaultNextPage#',
}) => {
  const { t } = useTranslation('brio')
  const { trackEvent } = useApplicationInsightsContext()

  if (hidden) {
    return <></>
  }

  return (
    <Button
      disabled={disabled}
      endIcon={<ButtonIcon icon={IconChevronRight} />}
      loading={loading}
      size="large"
      type="submit"
      variant="primary"
      width="full"
      onClick={() => trackEvent('nextPageBtn', { url: window.location.href })}
    >
      {t(text as any)}
    </Button>
  )
}
