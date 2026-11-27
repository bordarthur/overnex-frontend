import { useQuery } from '@tanstack/react-query';
import { semPermissao, useApiClient } from './client';
import { useClienteSlug } from './useClienteSlug';

/** Começo da query key dos valores da bandeja (qualquer empresa e mês). */
export const CHAVE_VALORES_NEGOCIOS = 'negocios-valores';

// Os valores mudam com a carga do dia, como as telas.
const VALIDADE_MS = 15 * 60_000;

/**
 * Valores da bandeja "Negócios" (GET /api/negocios): só pedidos com a bandeja aberta. Sem eles (ainda
 * chegando, ou a rota fora do ar), a bandeja funciona igual, só com as contagens.
 */
export function useValoresNegocios(mes: string | undefined, aberta: boolean) {
  const api = useApiClient();
  const cliente = useClienteSlug();
  return useQuery({
    queryKey: [CHAVE_VALORES_NEGOCIOS, cliente, mes ?? null],
    queryFn: ({ signal }) => api.obterValoresNegocios(cliente, { mes }, { signal }),
    enabled: aberta && cliente !== '',
    staleTime: VALIDADE_MS,
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 1,
  });
}
