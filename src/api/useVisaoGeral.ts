import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { semPermissao, useApiClient, type ApiClient, type FiltrosVisaoGeral } from './client';
import { useClienteSlug } from './useClienteSlug';

// O mesmo prazo do cache da API: o que foi adiantado conta como fresco por esse tempo.
const VALIDADE_MS = 15 * 60_000;

/** Começo da query key de toda Visão geral (qualquer empresa, mês e CNPJ). */
export const CHAVE_VISAO_GERAL = 'visao-geral';

/**
 * Consulta da Visão geral. A tela e os pedidos adiantados (adiantar.ts) usam estas mesmas opções,
 * para a tela aproveitar o que já chegou. Cada empresa (o slug da URL), mês e CNPJ é uma consulta.
 */
export function opcoesVisaoGeral(api: ApiClient, cliente: string, { mes, empresa }: FiltrosVisaoGeral = {}) {
  return queryOptions({
    queryKey: [CHAVE_VISAO_GERAL, cliente, mes ?? null, empresa ?? null],
    queryFn: ({ signal }) => api.obterVisaoGeral(cliente, { mes, empresa }, { signal }),
    staleTime: VALIDADE_MS,
    // Sem permissão não muda com nova tentativa.
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}

export function useVisaoGeral(filtros: FiltrosVisaoGeral = {}) {
  const api = useApiClient();
  const cliente = useClienteSlug();
  return useQuery({
    ...opcoesVisaoGeral(api, cliente, filtros),
    // Ao trocar o filtro, os números anteriores ficam na tela até os novos chegarem. Ao trocar de
    // empresa, não: seriam os números de outra.
    placeholderData: (anterior, consultaAnterior) =>
      consultaAnterior?.queryKey[1] === cliente ? keepPreviousData(anterior) : undefined,
  });
}
