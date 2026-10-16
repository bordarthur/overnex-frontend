/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENTE_PADRAO?: string;
  readonly VITE_MOCK_ATRASO_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
