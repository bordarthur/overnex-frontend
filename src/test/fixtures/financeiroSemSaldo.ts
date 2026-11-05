import type { CartaoSecao, VisaoGeralPayload } from '../../contracts/visaoGeral';

/**
 * O Financeiro como a API manda para um cliente sem fonte de saldo (a PJ Cortes, em 03/11/2026):
 * sem o KPI de saldo e sem a cobertura; próximos dias sem saldo nem caixa mínimo, com os textos
 * de sobra e falta; contas lançadas num grupo só; só o "A vencer" fica na barra.
 */
export function financeiroSemSaldo(base: VisaoGeralPayload): VisaoGeralPayload {
  const secoes = base.secoes.map((s) => {
    if (s.id !== 'financeiro') return s;
    const cartoes = s.cartoes.flatMap((c): CartaoSecao[] => {
      if (c.tipo === 'cobertura') return [];
      if (c.tipo === 'proximos-dias')
        return [
          {
            ...c,
            subtitulo:
              'O que vence a receber, menos o que vence a pagar: quanto sobra ou falta em cada janela',
            saldo: null,
            minimo: null,
            legenda: { ...c.legenda, saldo: null },
            janelas: c.janelas.map((j) => {
              const lancado = j.receber.valor - j.pagar.valor;
              const projecao = lancado + (j.novas?.valor ?? 0) - j.falta.valor;
              const fim = (v: number) => ({
                valor: { valor: v, unidade: 'brl' as const },
                status: v >= 0 ? ('saudavel' as const) : ('atencao' as const),
                texto: v >= 0 ? 'entra mais do que sai' : 'sai mais do que entra',
              });
              return { ...j, fim: { lancado: fim(lancado), projecao: fim(projecao) } };
            }),
          },
        ];
      if (c.tipo === 'pagar-lancado')
        return [
          {
            ...c,
            nota: 'De abril a setembro, a empresa pagou em média R$ 6,31 mi por mês.',
            rotuloGrupos: 'Pago por mês e lançado para 30 dias',
            grupos: [
              {
                nome: 'Todas as contas a pagar',
                status: 'atencao',
                percentual: { valor: 58, unidade: 'pct', casas: 0 },
                texto: 'lançado; falta R$ 2,65 mi',
                pagos: ['abr', 'mai', 'jun', 'jul', 'ago', 'set'].map((rotulo, i) => ({
                  rotulo,
                  valor: { valor: [6.12, 6.28, 6.41, 6.22, 6.35, 6.48][i]! * 1e6, unidade: 'brl' },
                })),
                media: { valor: { valor: 6310000, unidade: 'brl' }, rotulo: 'média R$ 6,31 mi' },
                proximos: {
                  rotulo: '30 dias',
                  lancado: { valor: { valor: 3660000, unidade: 'brl' }, rotulo: 'lançado' },
                  falta: { valor: { valor: 2650000, unidade: 'brl' }, rotulo: 'falta' },
                },
                nota: null,
              },
            ],
          },
        ];
      return [c];
    });
    return { ...s, kpis: s.kpis.filter((k) => k.rotulo !== 'Saldo em conta hoje'), cartoes };
  });
  return { ...base, secoes };
}
