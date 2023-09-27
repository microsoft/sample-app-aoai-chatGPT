import { useResponsiveProps } from '@carnegie/duplo'
import { FC } from 'react'
import { useNavigate } from 'react-router'
import { CarnegieHeader } from '../components/defaults/CarnegieHeader'
import { useCurity, useLanguage, useUser } from '../context'

export const CarnegieHeaderContainer: FC = () => {
  const navigate = useNavigate()
  const rp = useResponsiveProps()
  const { isLoggedIn, isLoading, logout } = useCurity()
  const { language, setLanguage } = useLanguage()
  const user = useUser()

  const onLogin = () => navigate('/login')
  const onLogout = () => logout()

  return (
    <CarnegieHeader
      displayName={rp([user.givenName, user.name, user.name])}
      isLoading={isLoading}
      isLoggedIn={isLoggedIn}
      language={language}
      onLogin={onLogin}
      onLogout={onLogout}
      setLanguage={setLanguage}
    />
  )
}
