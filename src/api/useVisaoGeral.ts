import { useQuery } from '@tanstack/react-query';
import { semPermissao, useApiClient } from './client';

export function useVisaoGeral(clienteSlug: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['visao-geral', clienteSlug],
    queryFn: ({ signal }) => api.obterVisaoGeral(clienteSlug, { signal }),
    // Sem permissão não muda com nova tentativa.
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
}
