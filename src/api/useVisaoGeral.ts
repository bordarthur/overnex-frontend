import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { semPermissao, useApiClient, type FiltrosVisaoGeral } from './client';

export function useVisaoGeral(clienteSlug: string, filtros: FiltrosVisaoGeral = {}) {
  const api = useApiClient();
  const { mes, empresa } = filtros;
  return useQuery({
    // Cada mês e empresa é uma consulta: trocar o filtro busca de novo.
    queryKey: ['visao-geral', clienteSlug, mes ?? null, empresa ?? null],
    queryFn: ({ signal }) => api.obterVisaoGeral(clienteSlug, { mes, empresa }, { signal }),
    // Ao trocar o filtro, os números anteriores ficam na tela até os novos chegarem.
    placeholderData: keepPreviousData,
    // Sem permissão não muda com nova tentativa.
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}
