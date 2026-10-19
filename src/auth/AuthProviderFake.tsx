import { useMemo, type ReactNode } from 'react';
import { AuthContext, type Auth } from './auth';

// SÓ PARA DESENVOLVIMENTO: devolve sempre um usuário logado, sem tela de login.
// TODO(auth): trocar por um AuthProvider com MSAL (Microsoft Entra) quando o login entrar.
// O token `fake:<object_id>` só vale na API local com AMBIENTE=dev e AUTH_FAKE=1; fora disso a API recusa.
// O object_id padrão é o da Ana no seed do overnex-backend.
const OBJECT_ID_FAKE = import.meta.env.VITE_AUTH_FAKE_OBJECT_ID || '0d000000-0000-4000-8000-00000000000a';
const USUARIO_DEV = { id: 'dev', nome: 'Usuário de desenvolvimento', email: 'dev@overnex.local' };

export function AuthProviderFake({ children }: { children: ReactNode }) {
  const auth = useMemo<Auth>(
    () => ({
      usuario: USUARIO_DEV,
      getToken: async () => `fake:${OBJECT_ID_FAKE}`,
      logout: async () => {},
    }),
    [],
  );
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
