/// <reference types="vite/client" />
/// <reference types="@emotion/react/types/css-prop" />

interface ImportMetaEnv {
  readonly VITE_AI_ENABLED: string
  readonly VITE_BFF_URL: string
  readonly VITE_CUSTOMER_SUPPORT_URL: string
  readonly VITE_I18N_DEBUG: string
  readonly VITE_REFRESH_TOKEN_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}
declare global {
  interface Window {
    readonly ENV: WindowEnv
  }
}

interface WindowEnv {
  readonly AI_API_KEY: string
  readonly AI_CORS: string
  readonly DEBUG: string
  readonly CUSTOMER_INFO_URL: string
  readonly USE_TRANSLATIONS: string
  readonly PB_ONLINE_LOGIN_URL: string
}
