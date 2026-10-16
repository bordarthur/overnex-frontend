import { createContext, useContext } from 'react';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

/** Contrato de autenticação. Hoje só há a implementação fake; o login com o Microsoft Entra entra em outra entrega. */
export interface Auth {
  usuario: Usuario | null;
  /** Token para chamar a API. Nunca guardar em localStorage. */
  getToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<Auth | null>(null);

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider.');
  return ctx;
}
