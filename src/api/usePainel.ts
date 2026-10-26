import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { TelaPainel } from '../contracts/painel';
import { semPermissao, useApiClient, type ApiClient, type FiltrosPainel } from './client';

// O mesmo prazo da Visão geral (e do cache da API).
const VALIDADE_MS = 15 * 60_000;

/**
 * Consulta de um painel por cartões. Cada combinação de filtros é uma consulta; as chaves vão
 * ordenadas para a mesma combinação cair no mesmo cache. Como na Visão geral, o slug não entra.
 */
export function opcoesPainel(api: ApiClient, tela: TelaPainel, filtros: FiltrosPainel = {}) {
  const chave = Object.entries(filtros).sort(([a], [b]) => a.localeCompare(b));
  return queryOptions({
    queryKey: ['painel', tela, chave],
    queryFn: ({ signal }) => api.obterPainel(tela, filtros, { signal }),
    staleTime: VALIDADE_MS,
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}

export function usePainel(tela: TelaPainel, filtros: FiltrosPainel = {}) {
  const api = useApiClient();
  return useQuery({
    ...opcoesPainel(api, tela, filtros),
    // Ao trocar o filtro, os números anteriores ficam na tela até os novos chegarem; ao trocar
    // de tela, não (seriam os números de outro painel).
    placeholderData: (anterior, consultaAnterior) =>
      consultaAnterior?.queryKey[1] === tela ? keepPreviousData(anterior) : undefined,
  });
}
