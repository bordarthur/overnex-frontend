import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GraficoLinhas } from '../contracts/painel';
import { Linhas } from './Linhas';

const ROTULO = 'R$ 8,56 mi em 07/11';

/** Desenha uma série com um ponto marcado e devolve o rótulo, o ponto e os pontos da linha. */
const desenhar = (valores: number[], i: number) => {
  const grafico: GraficoLinhas = {
    tipo: 'linhas',
    unidade: 'brl',
    rotulos: valores.map((_, k) => `d${k}`),
    series: [{ nome: 'Saldo', estilo: 'principal', valores }],
    marcadores: [{ serie: 0, i, rotulo: ROTULO }],
  };
  render(<Linhas grafico={grafico} aria="Saldo projetado" />);
  const svg = screen.getByRole('img', { name: 'Saldo projetado' });
  const texto = svg.querySelector('text.mklabel')!;
  const pontos = svg
    .querySelector('path.ln')!
    .getAttribute('d')!
    .slice(1)
    .split('L')
    .map((p) => p.split(',').map(Number) as [number, number]);
  return {
    x: Number(texto.getAttribute('x')),
    y: Number(texto.getAttribute('y')),
    ancora: texto.getAttribute('text-anchor'),
    ponto: Number(svg.querySelector('circle.mk')!.getAttribute('cy')),
    pontos,
  };
};

/** O rótulo (linha de base em `y`) está acima do ponto marcado e de todo ponto da linha por baixo dele. */
const esperarAcima = (d: ReturnType<typeof desenhar>) => {
  const largura = ROTULO.length * 7;
  const esquerda = d.ancora === 'end' ? d.x - largura : d.ancora === 'start' ? d.x : d.x - largura / 2;
  expect(d.y).toBeLessThan(d.ponto);
  expect(d.y).toBeGreaterThanOrEqual(12);
  const porBaixo = d.pontos.filter(([px]) => px >= esquerda && px <= esquerda + largura);
  expect(porBaixo.length).toBeGreaterThan(0);
  for (const [, py] of porBaixo) expect(d.y).toBeLessThan(py);
};

describe('linhas: rótulo do ponto marcado', () => {
  it('no começo, com a linha que cai e volta a subir: fica acima da linha, não embaixo', () => {
    esperarAcima(desenhar([8.56, 8.56, 7.2, 8.6, 8.4, 9.4, 10.2, 10.1, 8.3, 9.9, 9.3, 10], 0));
  });

  it('no começo, com a linha que sobe a partir do ponto: sobe junto, acima dela', () => {
    const d = desenhar([1.6, 2.4, 3.1, 3.6, 3.9, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9], 0);
    esperarAcima(d);
    // mais alto que os 12px de sempre acima do ponto
    expect(d.y).toBeLessThan(d.ponto - 12);
  });

  it('no vale: acima das duas subidas', () => {
    esperarAcima(desenhar([5, 4.6, 4.1, 3.2, 2.1, 1.1, 2.3, 3.4, 4.2, 4.8, 5.1, 5.3], 5));
  });

  it('no pico: os 12px de sempre acima do ponto', () => {
    const d = desenhar([2, 2.5, 3.1, 3.8, 4.6, 5.2, 4.4, 3.9, 3.1, 2.6, 2.2, 2], 5);
    esperarAcima(d);
    expect(d.y).toBeCloseTo(d.ponto - 12, 1);
  });

  it('dois rótulos que se encostariam: um em cima do outro, os dois dentro do desenho e acima da linha', () => {
    const valores = [2, 2.4, 3.1, 3.8, 4.6, 5.2, 5.1, 4.9, 5.2, 5, 4.8, 5.1];
    const grafico: GraficoLinhas = {
      tipo: 'linhas',
      unidade: 'brl',
      rotulos: valores.map((_, k) => `d${k}`),
      series: [{ nome: 'Saldo', estilo: 'principal', valores }],
      marcadores: [
        { serie: 0, i: 5, rotulo: ROTULO },
        { serie: 0, i: 6, rotulo: 'Menor saldo R$ 1,13 mi em 10/11' },
      ],
    };
    render(<Linhas grafico={grafico} aria="Dois pontos" />);
    const svg = screen.getByRole('img', { name: 'Dois pontos' });
    const ys = [...svg.querySelectorAll('text.mklabel')].map((el) => Number(el.getAttribute('y')));
    const maisAlto = Math.min(
      ...svg
        .querySelector('path.ln')!
        .getAttribute('d')!
        .slice(1)
        .split('L')
        .map((p) => Number(p.split(',')[1])),
    );
    expect(ys).toHaveLength(2);
    expect(Math.abs(ys[0]! - ys[1]!)).toBeGreaterThanOrEqual(15);
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(12);
      expect(y).toBeLessThan(maisAlto);
    }
  });
});
