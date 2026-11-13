import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { semPermissao, useApiClient, type ApiClient } from './client';
import { useClienteSlug } from './useClienteSlug';

/** Começo da query key de toda sessão (com ou sem empresa escolhida). */
export const CHAVE_SESSAO = 'sessao';

// A sessão muda pouco (quem mexe é a Gestão, que manda pedi-la de novo): não é pedida a cada tela.
const VALIDADE_MS = 5 * 60_000;

/**
 * GET /api/sessao. Sem `cliente` (em "/" e na Gestão), a API diz quem é a pessoa e quais empresas ela
 * abre; com o slug, traz também as empresas (CNPJs), as telas e os períodos daquela empresa.
 */
export function opcoesSessao(api: ApiClient, cliente?: string) {
  return queryOptions({
    queryKey: [CHAVE_SESSAO, cliente || null],
    queryFn: ({ signal }) => api.obterSessao(cliente || undefined, { signal }),
    staleTime: VALIDADE_MS,
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}

/**
 * A sessão da rota: com a empresa da URL, quando há. Dá os filtros (períodos e empresas), o menu
 * (telas liberadas) e o seletor de empresa. Falha aqui não derruba a tela.
 */
export function useSessao() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const cliente = useClienteSlug();
  const semCliente = opcoesSessao(api).queryKey;
  return useQuery({
    ...opcoesSessao(api, cliente),
    // Quem tem uma empresa só já a recebeu na sessão sem slug (pedida em "/"): é a mesma resposta.
    initialData: () => {
      if (!cliente) return undefined;
      const anterior = queryClient.getQueryData(semCliente);
      return anterior?.cliente?.slug === cliente ? anterior : undefined;
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(semCliente)?.dataUpdatedAt,
  });
}
