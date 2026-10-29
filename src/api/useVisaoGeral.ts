import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { semPermissao, useApiClient, type ApiClient, type FiltrosVisaoGeral } from './client';

// O mesmo prazo do cache da API: o que foi adiantado conta como fresco por esse tempo.
const VALIDADE_MS = 15 * 60_000;

/** Começo da query key de toda Visão geral (qualquer mês e empresa). */
export const CHAVE_VISAO_GERAL = 'visao-geral';

/**
 * Consulta da Visão geral. A tela e os pedidos adiantados (adiantar.ts) usam estas mesmas opções,
 * para a tela aproveitar o que já chegou. Cada mês e empresa é uma consulta. O slug da URL não
 * entra: a API tira o cliente do token, e o cache é apagado ao sair.
 */
export function opcoesVisaoGeral(api: ApiClient, { mes, empresa }: FiltrosVisaoGeral = {}) {
  return queryOptions({
    queryKey: [CHAVE_VISAO_GERAL, mes ?? null, empresa ?? null],
    queryFn: ({ signal }) => api.obterVisaoGeral({ mes, empresa }, { signal }),
    staleTime: VALIDADE_MS,
    // Sem permissão não muda com nova tentativa.
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}

export function useVisaoGeral(filtros: FiltrosVisaoGeral = {}) {
  const api = useApiClient();
  return useQuery({
    ...opcoesVisaoGeral(api, filtros),
    // Ao trocar o filtro, os números anteriores ficam na tela até os novos chegarem.
    placeholderData: keepPreviousData,
  });
}
