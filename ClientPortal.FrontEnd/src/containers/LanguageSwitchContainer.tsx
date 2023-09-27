import { FC } from 'react'
import { LanguageSwitch } from '../components/language/LanguageSwitch'
import { useLanguage } from '../context'
import { safelyParse } from '../utils/safely-parse'

export const LanguageSwitchContainer: FC = () => {
  const { language, setLanguage } = useLanguage()

  return (
    <LanguageSwitch
      language={language}
      setLanguage={setLanguage}
      useTranslations={safelyParse<boolean>(window.ENV?.USE_TRANSLATIONS)}
    />
  )
}
