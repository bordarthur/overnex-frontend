/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_ATRASO_MS?: string;
  readonly VITE_MOCK_CENARIO?: 'completo' | 'vazio' | 'erro' | 'sem-permissao';
  readonly VITE_API_MODO?: 'mock' | 'api';
  readonly VITE_AUTH_MODO?: 'fake' | 'api';
  readonly VITE_AUTH_FAKE_OBJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
