import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { TelaPainel } from '../contracts/painel';
import { semPermissao, useApiClient, type ApiClient, type FiltrosPainel } from './client';
import { useClienteSlug } from './useClienteSlug';

// O mesmo prazo da Visão geral (e do cache da API).
const VALIDADE_MS = 15 * 60_000;

/** Começo da query key de todo painel por cartões: `['painel', cliente, tela, filtros]`. */
export const CHAVE_PAINEL = 'painel';

/**
 * Consulta de um painel por cartões. Cada empresa e cada combinação de filtros é uma consulta; as
 * chaves dos filtros vão ordenadas para a mesma combinação cair no mesmo cache.
 */
export function opcoesPainel(api: ApiClient, cliente: string, tela: TelaPainel, filtros: FiltrosPainel = {}) {
  const chave = Object.entries(filtros).sort(([a], [b]) => a.localeCompare(b));
  return queryOptions({
    queryKey: [CHAVE_PAINEL, cliente, tela, chave],
    queryFn: ({ signal }) => api.obterPainel(cliente, tela, filtros, { signal }),
    staleTime: VALIDADE_MS,
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}

export function usePainel(tela: TelaPainel, filtros: FiltrosPainel = {}) {
  const api = useApiClient();
  const cliente = useClienteSlug();
  return useQuery({
    ...opcoesPainel(api, cliente, tela, filtros),
    // Ao trocar o filtro, os números anteriores ficam na tela até os novos chegarem; ao trocar
    // de tela ou de empresa, não (seriam os números de outro painel ou de outra empresa).
    placeholderData: (anterior, consultaAnterior) =>
      consultaAnterior?.queryKey[1] === cliente && consultaAnterior.queryKey[2] === tela
        ? keepPreviousData(anterior)
        : undefined,
  });
}
