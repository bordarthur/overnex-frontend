import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GraficoCascata } from '../contracts/painel';
import { MENOS } from '../format';
import { Cascata } from './Cascata';

const desenhar = (passos: GraficoCascata['passos']) => {
  render(<Cascata grafico={{ tipo: 'cascata', unidade: 'brl', passos }} aria="Cascata" />);
  const svg = screen.getByRole('img', { name: 'Cascata' });
  const altura = Number(svg.getAttribute('height'));
  const barras = [...svg.querySelectorAll('rect.wf-bar')].map((r) => ({
    y: Number(r.getAttribute('y')),
    h: Number(r.getAttribute('height')),
  }));
  return { svg, altura, barras };
};

describe('cascata', () => {
  it('com saldo negativo do começo ao fim, as barras ficam dentro do gráfico e há a linha do zero', () => {
    // saldo inicial da PJ (−2,1 mi), que piora e termina ainda negativo
    const { svg, altura, barras } = desenhar([
      { rotulo: 'Saldo inicial', de: 0, ate: -2103420, valor: -2103420, estilo: 'total' },
      { rotulo: 'Operação', de: -2103420, ate: -2053420, valor: 50000, estilo: 'positivo' },
      { rotulo: 'Financiamentos', de: -2053420, ate: -2173420, valor: -120000, estilo: 'negativo' },
      { rotulo: 'Saldo final', de: 0, ate: -2173420, valor: -2173420, estilo: 'total' },
    ]);
    for (const b of barras) {
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.h).toBeLessThanOrEqual(altura);
    }
    expect(svg.querySelector('line.ref.zero')).not.toBeNull();
    // barra toda abaixo de zero: o rótulo vai embaixo dela
    const rotulo = screen.getByText(`${MENOS}2,1 mi`, { selector: '.wf-val.total' });
    expect(Number(rotulo.getAttribute('y'))).toBeGreaterThan(barras[0]!.y + barras[0]!.h);
  });

  it('só com valores positivos, sem linha do zero e com o rótulo em cima da barra', () => {
    const { svg, barras } = desenhar([
      { rotulo: 'Receita', de: 0, ate: 1000, valor: 1000, estilo: 'total' },
      { rotulo: 'Custos', de: 1000, ate: 600, valor: -400, estilo: 'negativo' },
      { rotulo: 'Lucro', de: 0, ate: 600, valor: 600, estilo: 'total' },
    ]);
    expect(svg.querySelector('line.ref.zero')).toBeNull();
    const rotulo = svg.querySelector('text.wf-val')!;
    expect(Number(rotulo.getAttribute('y'))).toBeLessThan(barras[0]!.y);
  });
});
