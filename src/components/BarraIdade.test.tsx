import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarraIdade, type FaixaIdade } from './BarraIdade';

const faixa = (rotulo: string, valor: number, percentual: number, extra: Partial<FaixaIdade> = {}) => ({
  rotulo,
  valor: { valor, unidade: 'brl' as const },
  percentual,
  ...extra,
});

const quadros = (el: HTMLElement) => [...el.querySelectorAll('.at2 span')].map((q) => q.textContent);

describe('BarraIdade', () => {
  it('soNaBarra e sufixo nulos (como a API pode mandar): toda faixa tem quadro e o percentual vai sozinho', () => {
    const { container } = render(
      <BarraIdade
        faixas={[
          faixa('A vencer', 900, 90, { status: 'saudavel', soNaBarra: null }),
          faixa('1 a 30 dias', 100, 10, { status: 'atencao', soNaBarra: null }),
        ]}
        sufixo={null}
        aria="Idade"
      />,
    );
    expect(quadros(container)).toEqual(['A vencer', '1 a 30 dias']);
    expect([...container.querySelectorAll('.at2 em')].map((e) => e.textContent)).toEqual(['90,0%', '10,0%']);
    expect(container.querySelector('.inad-bar em')).toBeNull();
  });

  it('soNaBarra: a faixa fica só na barra, com o texto e o sufixo dentro', () => {
    const { container } = render(
      <BarraIdade
        faixas={[
          faixa('A vencer', 900, 90, { status: 'saudavel', soNaBarra: true }),
          faixa('1 a 30 dias', 100, 10, { status: 'atencao' }),
        ]}
        sufixo="do total"
        aria="Idade"
      />,
    );
    expect(quadros(container)).toEqual(['1 a 30 dias']);
    expect(container.querySelector('.inad-bar em')).toHaveTextContent('A vencer: R$ 900, 90,0% do total');
  });
});
