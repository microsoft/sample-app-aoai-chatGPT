/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OUT_OF_SCOPE_MESSAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
