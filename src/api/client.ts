import { createContext, useContext } from 'react';
import type { SessaoPayload } from '../contracts/sessao';
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

/** Filtros da consulta da Visão geral. Sem valor, a API usa o mês mais recente e todas as empresas. */
export interface FiltrosVisaoGeral {
  // AAAA-MM, um dos períodos de /api/sessao
  mes?: string;
  // UUID de uma empresa de /api/sessao
  empresa?: string;
}

export interface ApiClient {
  /** true enquanto o cliente for o mock com dado fictício. */
  readonly dadosFicticios: boolean;
  obterSessao(opcoes?: { signal?: AbortSignal }): Promise<SessaoPayload>;
  obterVisaoGeral(
    clienteSlug: string,
    filtros?: FiltrosVisaoGeral,
    opcoes?: { signal?: AbortSignal },
  ): Promise<VisaoGeralPayload>;
}

export const ApiClientContext = createContext<ApiClient | null>(null);

export function useApiClient(): ApiClient {
  const ctx = useContext(ApiClientContext);
  if (!ctx) throw new Error('useApiClient precisa estar dentro de <ApiClientContext.Provider>.');
  return ctx;
}
