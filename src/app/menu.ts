import { CODIGO_DA_TELA, type TelaApp } from '../contracts/telas';

/** Itens do menu, por grupo, na ordem do rail. Os rótulos são da interface; quais aparecem, a sessão decide. */
export const MENU: { grupo: string; telas: { rota: TelaApp; rotulo: string }[] }[] = [
  { grupo: 'Visão', telas: [{ rota: 'visao-geral', rotulo: 'Visão geral' }] },
  {
    grupo: 'Comercial',
    telas: [
      { rota: 'vendas', rotulo: 'Vendas' },
      { rota: 'equipe-comercial', rotulo: 'Equipe comercial' },
      { rota: 'clientes', rotulo: 'Clientes' },
    ],
  },
  {
    grupo: 'Financeiro',
    telas: [
      { rota: 'resultado', rotulo: 'Resultado' },
      { rota: 'receber-pagar', rotulo: 'Receber e pagar' },
      { rota: 'fluxo-caixa', rotulo: 'Fluxo de caixa' },
    ],
  },
  { grupo: 'Pessoas', telas: [{ rota: 'pessoas', rotulo: 'Pessoas' }] },
];

/** Todos os códigos de tela: o menu inteiro, para quando a sessão não respondeu (a API barra do mesmo jeito). */
export const TODAS_AS_TELAS = Object.values(CODIGO_DA_TELA);

/** A primeira tela do menu que a pessoa pode abrir (`telas` de /api/sessao). */
export function primeiraTela(liberadas: string[]): TelaApp | undefined {
  return MENU.flatMap((g) => g.telas).find((t) => liberadas.includes(CODIGO_DA_TELA[t.rota]))?.rota;
}
