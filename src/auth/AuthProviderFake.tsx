import { useMemo, type ReactNode } from 'react';
import { AuthContext, type Auth } from './auth';

// SÓ PARA DESENVOLVIMENTO: devolve sempre um usuário logado, sem tela de login.
// TODO(auth): trocar por um AuthProvider com MSAL (Microsoft Entra) quando o login entrar.
// O token abaixo não vale em API nenhuma; a API real recusa a chamada.
const USUARIO_DEV = { id: 'dev', nome: 'Usuário de desenvolvimento', email: 'dev@overnex.local' };

export function AuthProviderFake({ children }: { children: ReactNode }) {
  const auth = useMemo<Auth>(
    () => ({
      usuario: USUARIO_DEV,
      getToken: async () => 'token-fake-de-desenvolvimento',
      logout: async () => {},
    }),
    [],
  );
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
