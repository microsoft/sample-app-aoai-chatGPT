// import the original type declarations
import 'i18next'
// import all namespaces (for the default language, only)
import banners from '../public/locales/en/banners.json'
import brio from '../public/locales/en/brio.json'
import common from '../public/locales/en/common.json'
import components from '../public/locales/en/components.json'
import countries from '../public/locales/en/countries.json'
import errors from '../public/locales/en/errors.json'
import pages from '../public/locales/en/pages.json'
import questionnaires from '../public/locales/en/questionnaires.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      banners: typeof banners
      countries: typeof countries
      brio: typeof brio
      common: typeof common
      components: typeof components
      errors: typeof errors
      pages: typeof pages
      questionnaires: typeof questionnaires
    }
  }
}
