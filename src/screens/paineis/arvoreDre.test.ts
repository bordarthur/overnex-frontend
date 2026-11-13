import { describe, expect, it } from 'vitest';
import type { LinhaArvoreMensal, LinhaDre } from '../../contracts/painel';
import { abertasAteNivel, linhasVisiveis } from './arvoreDre';

const linha = (id: string, nivel: LinhaDre['nivel'], pai?: string, comDesvio = false): LinhaDre => ({
  id,
  nome: id,
  nivel,
  pai,
  realizado: 0,
  percentualReceitaBruta: 0,
  comparacao: 0,
  diferenca: 0,
  diferencaPercentual: null,
  status: comDesvio ? 'critico' : 'saudavel',
  comDesvio,
  tendencia: { realizado: [], comparacao: [] },
});

const LINHAS = [
  linha('100', 1, undefined, true),
  linha('100.01', 2, '100', true),
  linha('100.01.01', 3, '100.01', true),
  linha('100.01.02', 3, '100.01'),
  linha('sub-rl', 0, undefined, true),
  linha('110', 1),
  linha('110.01', 2, '110'),
];
const ids = (l: LinhaDre[]) => l.map((x) => x.id);

describe('árvore da DRE', () => {
  it('abre as linhas com filhos acima do nível escolhido', () => {
    expect([...abertasAteNivel(LINHAS, 1)]).toEqual([]);
    expect([...abertasAteNivel(LINHAS, 2)]).toEqual(['100', '110']);
    expect([...abertasAteNivel(LINHAS, 3)]).toEqual(['100', '100.01', '110']);
  });

  it('mostra uma linha só com o caminho aberto; subtotais sempre', () => {
    expect(ids(linhasVisiveis(LINHAS, new Set(), false))).toEqual(['100', 'sub-rl', '110']);
    // filho aberto com o pai fechado continua escondido
    expect(ids(linhasVisiveis(LINHAS, new Set(['100.01']), false))).toEqual(['100', 'sub-rl', '110']);
    expect(ids(linhasVisiveis(LINHAS, new Set(['100', '100.01']), false))).toEqual([
      '100',
      '100.01',
      '100.01.01',
      '100.01.02',
      'sub-rl',
      '110',
    ]);
  });

  it('"Só desvios" deixa as linhas que a API marcou e os subtotais', () => {
    const todas = abertasAteNivel(LINHAS, 3);
    expect(ids(linhasVisiveis(LINHAS, todas, true))).toEqual(['100', '100.01', '100.01.01', 'sub-rl']);
  });
});

describe('árvore mês a mês (fluxo de caixa)', () => {
  const linha = (id: string, nivel: LinhaArvoreMensal['nivel'], pai?: string): LinhaArvoreMensal => ({
    id,
    nome: id,
    nivel,
    pai,
    valores: [0],
  });
  // Entradas (1) > plano nível 1 (2) > nível 2 (3) > nível 3 (4)
  const FLUXO = [
    linha('saldo-inicial', 0),
    linha('ent', 1),
    linha('receb', 2, 'ent'),
    linha('vendas', 3, 'receb'),
    linha('vendas-prod', 4, 'vendas'),
    linha('fco', 0),
  ];

  it('vai até o nível 4, sem "Só desvios"', () => {
    expect([...abertasAteNivel(FLUXO, 4)]).toEqual(['ent', 'receb', 'vendas']);
    expect(linhasVisiveis(FLUXO, abertasAteNivel(FLUXO, 4)).map((l) => l.id)).toEqual([
      'saldo-inicial',
      'ent',
      'receb',
      'vendas',
      'vendas-prod',
      'fco',
    ]);
    expect(linhasVisiveis(FLUXO, abertasAteNivel(FLUXO, 2)).map((l) => l.id)).toEqual([
      'saldo-inicial',
      'ent',
      'receb',
      'fco',
    ]);
  });
});
