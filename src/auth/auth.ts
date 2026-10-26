import { createContext, useContext } from 'react';
import type { PedidoDefinirSenha, UsuarioAuth } from '../contracts/auth';

/** verificando: ainda tentando renovar a sessão do cookie, ao abrir o site. */
export type EstadoAuth = 'verificando' | 'anonimo' | 'autenticado';

/** Contrato de autenticação (login com e-mail e senha, via /api/auth/*). */
export interface Auth {
  estado: EstadoAuth;
  usuario: UsuarioAuth | null;
  /** true quando o próprio usuário clicou em Sair: a volta para o login não guarda a tela em que ele estava. */
  saiu: boolean;
  /** Quem estava logado quando a sessão caiu no meio do uso (a renovação foi recusada). Senão, null. */
  sessaoEncerrada: UsuarioAuth | null;
  /** Token para chamar a API, renovado perto de vencer. Fica só na memória: nunca guardar em storage. */
  getToken: () => Promise<string | null>;
  /** Pede um token novo (depois de um 401). null quando a sessão acabou; aí o estado vira anônimo. */
  renovarToken: () => Promise<string | null>;
  entrar: (email: string, senha: string) => Promise<void>;
  esqueciSenha: (email: string) => Promise<void>;
  definirSenha: (pedido: PedidoDefinirSenha) => Promise<void>;
  sair: () => Promise<void>;
}

export const AuthContext = createContext<Auth | null>(null);

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider.');
  return ctx;
}
