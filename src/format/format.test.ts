import { describe, expect, it } from 'vitest';
import {
  formatarAtualizacao,
  formatarDataHora,
  formatarDelta,
  formatarEixoMoeda,
  formatarEscala,
  formatarMoeda,
  formatarPct,
  formatarRotulo,
  formatarValor,
  MENOS,
} from '.';

describe('formatadores de número', () => {
  it('usa o sinal de menos tipográfico (U+2212)', () => {
    expect(MENOS).toBe('−');
  });

  it('formata moeda como o mockup', () => {
    expect(formatarMoeda(6_540_000)).toBe('R$ 6,54 mi');
    expect(formatarMoeda(-360_000)).toBe('−R$ 360 mil');
    expect(formatarMoeda(2995, { compacto: false })).toBe('R$ 2.995');
    expect(formatarEixoMoeda(6_540_000)).toBe('6,5 mi');
    expect(formatarPct(7.4)).toBe('7,4%');
  });

  it('formata cada unidade', () => {
    expect(formatarValor({ valor: 6_540_000, unidade: 'brl' })).toBe('R$ 6,54 mi');
    expect(formatarValor({ valor: 2995, unidade: 'brl', compacto: false })).toBe('R$ 2.995');
    expect(formatarValor({ valor: 54_720, unidade: 'brl', casasMil: 1 })).toBe('R$ 54,7 mil');
    // `casas` vale para milhões; nos milhares, só `casasMil` põe vírgula
    expect(formatarValor({ valor: -360_000, unidade: 'brl', casas: 1 })).toBe('−R$ 360 mil');
    expect(formatarValor({ valor: 94.8, unidade: 'pct', casas: 1 })).toBe('94,8%');
    expect(formatarValor({ valor: 0.61, unidade: 'vezes', casas: 2 })).toBe('0,61x');
    expect(formatarValor({ valor: 7, unidade: 'dias' })).toBe('7 dias');
    expect(formatarValor({ valor: 1040, unidade: 'qtd' })).toBe('1.040');
    expect(formatarValor({ valor: 2.3, unidade: 'qtd', casas: 1, sufixo: 'linhas' })).toBe('2,3 linhas');
  });

  it('formata deltas com sinal e "na média" no zero', () => {
    expect(formatarDelta({ valor: -360_000, unidade: 'brl' })).toBe('−R$ 360 mil');
    expect(formatarDelta({ valor: -1_100_000, unidade: 'brl', casas: 1 })).toBe('−R$ 1,1 mi');
    expect(formatarDelta({ valor: 2.9, unidade: 'pp', casas: 1 })).toBe('+2,9 p.p.');
    expect(formatarDelta({ valor: -0.3, unidade: 'pp', casas: 1 })).toBe('−0,3 p.p.');
    expect(formatarDelta({ valor: -1.39, unidade: 'vezes', casas: 2 })).toBe('−1,39x');
    expect(formatarDelta({ valor: -80, unidade: 'qtd', sufixo: 'clientes' })).toBe('−80 clientes');
    expect(formatarDelta({ valor: 0, unidade: 'dias' })).toBe('na média');
  });

  it('formata a escala do velocímetro', () => {
    expect(formatarEscala(80, 'pct', 'inicio')).toBe('80%');
    expect(formatarEscala(70.3, 'pct', 'divisao')).toBe('70,3%');
    expect(formatarEscala(0, 'dias', 'inicio')).toBe('0');
    expect(formatarEscala(8, 'dias', 'divisao')).toBe('8 d');
    expect(formatarEscala(24, 'dias', 'fim')).toBe('24 dias');
    expect(formatarEscala(3.5, 'vezes', 'fim')).toBe('3,5x');
  });

  it('formata rótulos curtos de gráfico', () => {
    expect(formatarRotulo(6_540_000, 'brl', 2)).toBe('6,54 mi');
    expect(formatarRotulo(2995, 'brl', 0)).toBe('R$ 2.995');
    expect(formatarRotulo(7, 'dias')).toBe('7 d');
    expect(formatarRotulo(58, 'pct', 0)).toBe('58%');
  });
});

describe('formatadores de data', () => {
  const carga = '2026-10-13T09:02:00-03:00';

  it('diz "hoje", "ontem" ou a data da carga', () => {
    expect(formatarAtualizacao('2026-10-12', carga, new Date('2026-10-13T18:00:00-03:00'))).toBe(
      'Dados até 12/10, atualizados hoje às 9h',
    );
    expect(formatarAtualizacao('2026-10-12', carga, new Date('2026-10-14T08:00:00-03:00'))).toBe(
      'Dados até 12/10, atualizados ontem às 9h',
    );
    expect(formatarAtualizacao('2026-10-12', carga, new Date('2026-10-16T08:00:00-03:00'))).toBe(
      'Dados até 12/10, atualizados em 13/10 às 9h',
    );
  });

  it('formata a última carga do rodapé', () => {
    expect(formatarDataHora(carga)).toBe('13/10/2026 às 9h02');
  });
});
