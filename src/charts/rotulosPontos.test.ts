import { describe, expect, it } from 'vitest';
import { posicionarRotulos, type Bolha, type Caixa } from './rotulosPontos';

const area: Caixa = { x: 0, y: 0, w: 400, h: 300 };
const sobrepoe = (a: Caixa, b: Caixa) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const tocaBolha = (c: Caixa, b: Bolha) => {
  const px = Math.max(c.x, Math.min(b.x, c.x + c.w));
  const py = Math.max(c.y, Math.min(b.y, c.y + c.h));
  return (px - b.x) ** 2 + (py - b.y) ** 2 < b.r ** 2;
};

describe('posicionarRotulos', () => {
  it('bolha sozinha: o nome vai à direita, colado, sem traço', () => {
    const [posto] = posicionarRotulos([{ i: 0, largura: 50 }], [{ x: 100, y: 100, r: 10 }], area);
    expect(posto?.caixa.x).toBe(114);
    expect(posto?.linha).toBeNull();
  });

  it('perto da borda direita, o nome vai para a esquerda', () => {
    const [posto] = posicionarRotulos([{ i: 0, largura: 50 }], [{ x: 390, y: 100, r: 5 }], area);
    expect(posto!.caixa.x + posto!.caixa.w).toBeLessThanOrEqual(390);
  });

  it('bolhas amontoadas: nenhum nome em cima de outro nem de uma bolha', () => {
    const bolhas: Bolha[] = Array.from({ length: 8 }, (_, k) => ({
      x: 150 + k * 9,
      y: 150 + (k % 3) * 6,
      r: 8,
    }));
    const postos = posicionarRotulos(
      bolhas.map((_, i) => ({ i, largura: 60 })),
      bolhas,
      area,
    );
    expect(postos.length).toBeGreaterThan(4);
    postos.forEach((a, k) => {
      postos.slice(k + 1).forEach((b) => expect(sobrepoe(a.caixa, b.caixa)).toBe(false));
      bolhas.forEach((b) => expect(tocaBolha(a.caixa, b)).toBe(false));
    });
    // os que ficaram longe da bolha ganham o traço
    expect(postos.some((p) => p.linha)).toBe(true);
  });

  it('o traço do nome afastado não atravessa outra bolha', () => {
    // a bolha 0 fica cercada; a 1, logo acima dela, não pode ser cortada pelo traço
    const bolhas: Bolha[] = [
      { x: 200, y: 150, r: 6 },
      { x: 200, y: 125, r: 10 },
      { x: 230, y: 150, r: 18 },
      { x: 170, y: 150, r: 18 },
    ];
    const postos = posicionarRotulos([{ i: 0, largura: 40 }], bolhas, area);
    const linha = postos[0]?.linha;
    expect(linha).not.toBeNull();
    const [x1, y1, x2, y2] = linha!;
    for (let t = 0; t <= 1; t += 0.05) {
      const b = bolhas[1]!;
      expect(Math.hypot(x1 + (x2 - x1) * t - b.x, y1 + (y2 - y1) * t - b.y)).toBeGreaterThan(b.r);
    }
  });

  it('não passa por cima dos bloqueios (nomes dos quadrantes)', () => {
    const bloqueio: Caixa = { x: 100, y: 90, w: 120, h: 20 };
    const [posto] = posicionarRotulos([{ i: 0, largura: 50 }], [{ x: 90, y: 100, r: 5 }], area, [bloqueio]);
    expect(sobrepoe(posto!.caixa, bloqueio)).toBe(false);
  });

  it('sem lugar livre, o nome fica de fora', () => {
    const postos = posicionarRotulos([{ i: 0, largura: 500 }], [{ x: 200, y: 150, r: 5 }], area);
    expect(postos).toEqual([]);
  });
});
