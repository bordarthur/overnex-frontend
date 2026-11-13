import type { TelaPainel } from './painel';

/** As telas de uma empresa: a Visão geral e os painéis por cartões. É o trecho da rota (`/:clienteSlug/<tela>`). */
export type TelaApp = 'visao-geral' | TelaPainel;

/**
 * Código de cada tela na API (o mesmo de `telas` em /api/sessao e do catálogo da Gestão). A tela só
 * aparece no menu, e só abre, quando o código vem na sessão.
 */
export const CODIGO_DA_TELA: Record<TelaApp, string> = {
  'visao-geral': 'VG-01',
  vendas: 'COM-01',
  'equipe-comercial': 'COM-02',
  clientes: 'COM-03',
  resultado: 'FIN-02',
  'receber-pagar': 'FIN-03',
  'fluxo-caixa': 'FIN-04',
  pessoas: 'PES-01',
};

export const ehTelaApp = (rota: string | undefined): rota is TelaApp =>
  rota !== undefined && Object.hasOwn(CODIGO_DA_TELA, rota);
