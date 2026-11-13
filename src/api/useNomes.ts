import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { TelaPainel } from '../contracts/painel';
import { semPermissao, useApiClient, type FiltrosPainel } from './client';
import { useClienteSlug } from './useClienteSlug';

// Dado nominal (salário por pessoa) fica pouco na memória: desligar a chave apaga na hora (esquecer),
// e o cartão que sai da tela leva um minuto. Sair do sistema apaga o cache inteiro, como sempre.
const GUARDAR_MS = 60_000;

/**
 * Tabela de uma linha por pessoa de um cartão com "Mostrar nomes". Só pede com a chave ligada; cada
 * empresa e cada combinação de filtros do painel é uma consulta, como em usePainel.
 */
export function useNomes(tela: TelaPainel, cartao: string, filtros: FiltrosPainel, ligado: boolean) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const cliente = useClienteSlug();
  const chave = Object.entries(filtros).sort(([a], [b]) => a.localeCompare(b));
  const consulta = useQuery({
    queryKey: ['nomes', cliente, tela, cartao, chave],
    queryFn: ({ signal }) => api.obterNomes(cliente, tela, cartao, filtros, { signal }),
    enabled: ligado,
    // pede de novo a cada vez que a chave é ligada: o acesso pode ter mudado
    staleTime: 0,
    gcTime: GUARDAR_MS,
    retry: (falhas, erro) => !semPermissao(erro) && falhas < 2,
  });
  const esquecer = useCallback(
    () => queryClient.removeQueries({ queryKey: ['nomes', cliente, tela, cartao] }),
    [queryClient, cliente, tela, cartao],
  );
  return { consulta, esquecer };
}
