import { useQuery } from '@tanstack/react-query';
import { semPermissao, useApiClient } from './client';

/** GET /api/sessao: períodos e empresas dos filtros. Falha aqui não derruba a tela. */
export function useSessao() {
  const api = useApiClient();
  return useQuery({
    queryKey: ['sessao'],
    queryFn: ({ signal }) => api.obterSessao({ signal }),
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}
