import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ChainedBackend from 'i18next-chained-backend'
import HttpBackend from 'i18next-http-backend'
import LocalStorageBackend from 'i18next-localstorage-backend'
import { initReactI18next } from 'react-i18next'
import { safelyParse } from './utils/safely-parse'

export const supportedLngs =
  safelyParse(window.ENV?.USE_TRANSLATIONS) === true ? ['sv', 'en'] : ['sv']

const debug = safelyParse(import.meta.env.VITE_I18N_DEBUG) === true
const ns = 'common'
const cacheDuration = 1 * 24 * 60 * 60 * 1000 // 1 day

i18n
  .use(ChainedBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug,
    defaultNS: ns,
    fallbackLng: 'sv',
    ns,
    saveMissing: debug,
    saveMissingPlurals: debug,
    supportedLngs,
    backend: {
      backends: [LocalStorageBackend, HttpBackend],
      backendOptions: [
        {
          expirationTime: cacheDuration,
        },
        {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
      ],
    },
  })

export default i18n
