import { Button } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  onClick(): void
}

export const BrioReturn: FC<Props> = ({ onClick }) => {
  const { t } = useTranslation('brio')

  return (
    <Button onClick={onClick} size="medium" variant="tertiary" width="full">
      {t('finalPage.returnToDashboard')}
    </Button>
  )
}
