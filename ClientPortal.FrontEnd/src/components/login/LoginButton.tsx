import { Button, Icon, IconBankId } from '@carnegie/duplo'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplicationInsightsContext } from '../../context'

type Props = {
  onClick(): Promise<void>
  btnText?: string
}

export const LoginButton: FC<Props> = ({ onClick, btnText }) => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const { trackEvent } = useApplicationInsightsContext()

  const clickHandler = () => {
    setLoading(true)
    trackEvent('loginBtn')
    return onClick().catch(() => setLoading(false))
  }

  return (
    <Button
      startIcon={<Icon icon={IconBankId} />}
      loading={loading}
      size="large"
      type="submit"
      variant="primary"
      width="full"
      onClick={clickHandler}
    >
      {t(btnText ? btnText : ('verbs.login' as any))}
    </Button>
  )
}
