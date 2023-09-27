import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

const ns = ['common']
const supportedLngs = ['en', 'sv']

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(Backend)
  .init({
    debug: true,
    defaultNS: 'common',
    fallbackLng: 'sv',
    interpolation: { escapeValue: false },
    lng: 'sv',
    ns,
    react: { useSuspense: false },
    saveMissing: true,
    saveMissingPlurals: true,
    supportedLngs,
  })

export default i18n
