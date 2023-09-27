import { ButtonSwitch, IconFlagSweden, IconFlagUk } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitchItem } from './LanguageSwitchItem'

type Props = {
  language: string
  useTranslations: boolean
  setLanguage(language: string): void
}

export const LanguageSwitch: FC<Props> = ({ language, useTranslations, setLanguage }) => {
  const { t } = useTranslation('common')

  const languages = [
    {
      label: <LanguageSwitchItem icon={IconFlagSweden} label={t('languages.sv')} />,
      value: 'sv',
    },
  ]

  useTranslations &&
    languages.unshift({
      label: <LanguageSwitchItem icon={IconFlagUk} label={t('languages.en')} />,
      value: 'en',
    })

  return (
    <ButtonSwitch
      onChange={setLanguage}
      options={languages}
      size="small"
      value={language}
      className={'languageSwitch'}
    />
  )
}
