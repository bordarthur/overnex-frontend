import { describe, expect, it } from 'vitest';
import { anguloPonteiro, passoDosRotulos, quebrarRotulo, ticksRedondos, topoDoCaminho } from './geometria';

describe('topoDoCaminho', () => {
  // y para baixo, como no SVG: o topo é o menor y
  const linha: [number, number][] = [
    [0, 100],
    [10, 100],
    [20, 140],
    [30, 60],
    [40, 80],
  ];

  it('pega o ponto mais alto da linha dentro do trecho', () => {
    expect(topoDoCaminho(linha, 0, 40)).toBe(60);
    expect(topoDoCaminho(linha, 0, 20)).toBe(100);
  });

  it('conta onde a linha cruza as bordas do trecho', () => {
    // entre x=20 (y 140) e x=30 (y 60), em x=25 a linha está em y 100
    expect(topoDoCaminho(linha, 12, 25)).toBe(100);
    // trecho no meio de um segmento, sem nenhum ponto dentro
    expect(topoDoCaminho(linha, 22, 24)).toBeCloseTo(108);
  });

  it('sem linha no trecho, null', () => {
    expect(topoDoCaminho(linha, 50, 60)).toBeNull();
    expect(topoDoCaminho([], 0, 10)).toBeNull();
  });
});

describe('anguloPonteiro', () => {
  it('vai de 0° no mínimo a 180° no máximo', () => {
    expect(anguloPonteiro(80, 80, 110)).toBe(0);
    expect(anguloPonteiro(110, 80, 110)).toBe(180);
    expect(anguloPonteiro(95, 80, 110)).toBe(90);
  });

  it('prende valores fora da escala nas pontas', () => {
    expect(anguloPonteiro(50, 80, 110)).toBe(0);
    expect(anguloPonteiro(200, 80, 110)).toBe(180);
    expect(anguloPonteiro(-1, 0, 3.5)).toBe(0);
  });

  it('escala sem largura não quebra', () => {
    expect(anguloPonteiro(5, 10, 10)).toBe(0);
  });
});

describe('passoDosRotulos', () => {
  const meses = ['out', 'nov', 'dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set'];
  const comAno = meses.map((m, i) => `${m}-${i < 3 ? 25 : 26}`);

  it('rótulo curto com espaço: mostra todos', () => {
    expect(passoDosRotulos(meses, 330, { minimo: 26 })).toBe(1);
  });

  it('o mesmo espaço com "out-25": mostra um sim, um não', () => {
    expect(passoDosRotulos(comAno, 330, { minimo: 26 })).toBe(2);
  });

  it('o espaçamento mínimo do gráfico continua valendo para rótulos curtos', () => {
    expect(passoDosRotulos(meses, 330, { minimo: 52 })).toBe(2);
  });
});

describe('ticksRedondos', () => {
  it('gera passos redondos', () => {
    expect(ticksRedondos(0, 8, 4)).toEqual([0, 2, 4, 6, 8]);
  });
});

describe('quebrarRotulo', () => {
  it('divide no meio das palavras; uma palavra só fica numa linha', () => {
    expect(quebrarRotulo('Custo da mercadoria')).toEqual(['Custo da', 'mercadoria']);
    expect(quebrarRotulo('Despesas variáveis')).toEqual(['Despesas', 'variáveis']);
    expect(quebrarRotulo('EBITDA')).toEqual(['EBITDA', '']);
  });
});
