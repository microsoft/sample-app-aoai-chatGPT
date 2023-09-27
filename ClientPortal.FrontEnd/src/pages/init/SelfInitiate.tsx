import { FC } from 'react'
import { useNavigate } from 'react-router'
import { CenteredLoading } from '../../components/defaults/CenteredLoading'
import { useUser } from '../../context/providers/user-context-provider'
import { useBff } from '../../hooks/api/use-bff'
import { useLockedEffect } from '../../hooks/use-locked-effect'

export const SelfInitiate: FC = () => {
  const bff = useBff()
  const { reload } = useUser()
  const navigate = useNavigate()

  useLockedEffect(
    () =>
      bff
        .post('init/new')
        .then(() => reload())
        .then(() => navigate('/'))
        .catch(() => navigate('/forbidden')),
    [],
  )

  return <CenteredLoading />
}
