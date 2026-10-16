import { createContext, useContext } from 'react';
import type { VisaoGeralPayload } from '../contracts/visaoGeral';

// Segurança: o cliente (e, depois, a empresa) que aparece na URL serve só para navegar.
// Quem decide se o usuário pode ver aqueles dados é a API, a partir do token. O front nunca filtra acesso.

export class ApiErro extends Error {
  readonly status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = 'ApiErro';
    this.status = status;
  }
}

export const semPermissao = (erro: unknown) =>
  erro instanceof ApiErro && (erro.status === 401 || erro.status === 403 || erro.status === 404);

export interface ApiClient {
  /** true enquanto o cliente for o mock com dado fictício. */
  readonly dadosFicticios: boolean;
  obterVisaoGeral(clienteSlug: string, opcoes?: { signal?: AbortSignal }): Promise<VisaoGeralPayload>;
}

export const ApiClientContext = createContext<ApiClient | null>(null);

export function useApiClient(): ApiClient {
  const ctx = useContext(ApiClientContext);
  if (!ctx) throw new Error('useApiClient precisa estar dentro de <ApiClientContext.Provider>.');
  return ctx;
}
