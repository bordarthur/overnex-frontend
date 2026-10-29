import { describe, expect, it } from 'vitest';
import { anguloPonteiro, quebrarRotulo, ticksRedondos } from './geometria';

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
