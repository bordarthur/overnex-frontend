import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/auth';
import type { PeriodoDisponivel } from '../contracts/sessao';
import { useApiClient, type FiltrosVisaoGeral } from './client';
import { opcoesVisaoGeral } from './useVisaoGeral';

// Pedidos adiantados: o front busca o que a pessoa provavelmente vai abrir, com as mesmas
// query keys das telas, para elas acharem a resposta pronta no cache. Ao sair, o AuthProvider
// apaga o cache inteiro, inclusive o que foi adiantado.

/**
 * Ao abrir uma empresa (ou trocar de empresa), pede a Visão geral padrão dela, seja qual for a tela
 * aberta. Só quando a sessão diz que a Visão geral está liberada (`liberada`): sem isso o pedido
 * viraria um 403 à toa, e toda negação fica no registro de acessos da API.
 * A sessão vem antes porque é ela que dá o slug a quem entra por "/": a Visão geral precisa do
 * `?cliente=` (obrigatório para o Admin BORD e para quem tem mais de uma empresa).
 */
export function useAdiantarAoEntrar(cliente: string, liberada: boolean) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cliente || !liberada) return;
    void queryClient.prefetchQuery(opcoesVisaoGeral(api, cliente));
  }, [cliente, liberada, api, queryClient]);
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
export function useAdiantarMeses(
  cliente: string,
  filtros: FiltrosVisaoGeral,
  periodos: PeriodoDisponivel[],
  pronto: boolean,
) {
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
    if (!pronto || !alvos || !cliente) return;
    const controle = new AbortController();
    void (async () => {
      for (const alvo of alvos.split(',')) {
        await emCurso.current;
        await abaVisivel(controle.signal);
        // Filtro trocado, tela fechada ou sessão encerrada no meio do caminho: para por aqui.
        if (controle.signal.aborted || !(await getToken())) return;
        const pedido = queryClient.prefetchQuery(opcoesVisaoGeral(api, cliente, { mes: alvo, empresa }));
        emCurso.current = pedido;
        await pedido;
      }
    })();
    return () => controle.abort();
  }, [pronto, alvos, cliente, empresa, api, queryClient, getToken]);
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
