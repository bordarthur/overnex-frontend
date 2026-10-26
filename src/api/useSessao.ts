import { queryOptions, useQuery } from '@tanstack/react-query';
import { semPermissao, useApiClient, type ApiClient } from './client';

/** GET /api/sessao. As mesmas opções servem para o pedido adiantado ao entrar (adiantar.ts). */
export function opcoesSessao(api: ApiClient) {
  return queryOptions({
    queryKey: ['sessao'],
    queryFn: ({ signal }) => api.obterSessao({ signal }),
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}

/** Períodos e empresas dos filtros e o slug do cliente. Falha aqui não derruba a tela. */
export function useSessao() {
  return useQuery(opcoesSessao(useApiClient()));
}
