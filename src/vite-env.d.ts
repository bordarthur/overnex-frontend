/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENTE_PADRAO?: string;
  readonly VITE_MOCK_ATRASO_MS?: string;
  readonly VITE_API_MODO?: 'mock' | 'api';
  readonly VITE_AUTH_FAKE_OBJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
