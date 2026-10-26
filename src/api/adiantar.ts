import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/auth';
import type { PeriodoDisponivel } from '../contracts/sessao';
import { useApiClient, type FiltrosVisaoGeral } from './client';
import { opcoesSessao } from './useSessao';
import { opcoesVisaoGeral } from './useVisaoGeral';

// Pedidos adiantados: o front busca o que a pessoa provavelmente vai abrir, com as mesmas
// query keys das telas, para elas acharem a resposta pronta no cache. Ao sair, o AuthProvider
// apaga o cache inteiro, inclusive o que foi adiantado.

/**
 * Assim que há sessão (entrou, definiu a senha ou renovou ao abrir o site), pede /api/sessao e a
 * Visão geral padrão juntas. Sem `mes`, a Visão geral não depende da sessão: a API usa o cliente e as
 * empresas do vínculo do usuário.
 */
export function useAdiantarAoEntrar() {
  const { estado } = useAuth();
  const api = useApiClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (estado !== 'autenticado') return;
    void queryClient.prefetchQuery(opcoesSessao(api));
    void queryClient.prefetchQuery(opcoesVisaoGeral(api));
  }, [estado, api, queryClient]);
}

/**
 * Meses que valem adiantar: na visão padrão, os 2 anteriores ao mais recente; com um mês escolhido,
 * o anterior a ele. `periodos` vem do mais recente para o mais antigo.
 */
export function mesesParaAdiantar(periodos: string[], mes: string | undefined): string[] {
  if (!mes) return periodos.slice(1, 3);
  const i = periodos.indexOf(mes);
  return i < 0 ? [] : periodos.slice(i + 1, i + 2);
}

/**
 * Depois que a Visão geral aparece (`pronto`), pede em segundo plano os meses vizinhos.
 * Um pedido por vez (cada Visão geral usa até 3 conexões do banco no back) e só com a aba visível.
 * O que já está fresco no cache não é pedido de novo (prefetchQuery respeita o staleTime).
 */
export function useAdiantarMeses(filtros: FiltrosVisaoGeral, periodos: PeriodoDisponivel[], pronto: boolean) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  // O pedido adiantado em andamento; o próximo só sai depois dele, mesmo vindo de outra rodada.
  const emCurso = useRef<Promise<unknown>>(Promise.resolve());
  const { mes, empresa } = filtros;
  // Em texto, para a dependência do efeito comparar por valor.
  const alvos = mesesParaAdiantar(
    periodos.map((p) => p.id),
    mes,
  ).join(',');

  useEffect(() => {
    if (!pronto || !alvos) return;
    const controle = new AbortController();
    void (async () => {
      for (const alvo of alvos.split(',')) {
        await emCurso.current;
        await abaVisivel(controle.signal);
        // Filtro trocado, tela fechada ou sessão encerrada no meio do caminho: para por aqui.
        if (controle.signal.aborted || !(await getToken())) return;
        const pedido = queryClient.prefetchQuery(opcoesVisaoGeral(api, { mes: alvo, empresa }));
        emCurso.current = pedido;
        await pedido;
      }
    })();
    return () => controle.abort();
  }, [pronto, alvos, empresa, api, queryClient, getToken]);
}

// Resolve quando a aba estiver visível (ou quando a rodada for cancelada).
function abaVisivel(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (document.visibilityState === 'visible' || signal.aborted) return resolve();
    const fim = () => {
      document.removeEventListener('visibilitychange', aoMudar);
      signal.removeEventListener('abort', fim);
      resolve();
    };
    const aoMudar = () => {
      if (document.visibilityState === 'visible') fim();
    };
    document.addEventListener('visibilitychange', aoMudar);
    signal.addEventListener('abort', fim);
  });
}
