// Geometria pura dos gráficos (sem React), portada do mockup.

/** Ticks "redondos" entre lo e hi (porta `niceTicks`). */
export function ticksRedondos(lo: number, hi: number, quantidade: number): number[] {
  const bruto = (hi - lo) / quantidade;
  if (!(bruto > 0) || !Number.isFinite(bruto)) return [lo];
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const r = bruto / mag;
  const passo = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let t = Math.ceil(lo / passo) * passo; t <= hi + 1e-9; t += passo) out.push(+t.toFixed(10));
  return out;
}

const prender = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Rotação do ponteiro do velocímetro, em graus: 0 aponta para o mínimo (esquerda), 180 para o máximo (direita).
 * Valores fora da escala ficam presos nas pontas.
 */
export function anguloPonteiro(valor: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  return ((prender(valor, min, max) - min) / (max - min)) * 180;
}

/** Ângulo polar (radianos) de um valor no semicírculo: π no mínimo, 0 no máximo. */
export function anguloRad(valor: number, min: number, max: number): number {
  return Math.PI * (1 - anguloPonteiro(valor, min, max) / 180);
}

/** Ponto no círculo de centro (cx, cy), com y para baixo como no SVG. */
export function pontoPolar(cx: number, cy: number, raio: number, angulo: number): [number, number] {
  return [+(cx + raio * Math.cos(angulo)).toFixed(1), +(cy - raio * Math.sin(angulo)).toFixed(1)];
}

/**
 * O ponto mais alto (menor y, como no SVG) de uma linha entre x0 e x1, contando onde ela cruza as
 * bordas do trecho. Sem linha no trecho, null.
 */
export function topoDoCaminho(pts: [number, number][], x0: number, x1: number): number | null {
  const ys: number[] = [];
  pts.forEach(([px, py], i) => {
    if (px >= x0 && px <= x1) ys.push(py);
    const prox = pts[i + 1];
    if (!prox) return;
    for (const borda of [x0, x1]) {
      if (borda > px && borda < prox[0]) ys.push(py + ((prox[1] - py) * (borda - px)) / (prox[0] - px));
    }
  });
  return ys.length > 0 ? Math.min(...ys) : null;
}

/** Rótulo em até duas linhas, quebrado no meio das palavras ("Custo da" / "mercadoria"). */
export function quebrarRotulo(rotulo: string): [string, string] {
  const palavras = rotulo.split(' ');
  if (palavras.length < 2) return [rotulo, ''];
  const meio = Math.ceil(palavras.length / 2);
  return [palavras.slice(0, meio).join(' '), palavras.slice(meio).join(' ')];
}

/** Largura aproximada do maior rótulo do eixo x (Poppins 11px: cerca de 6,2px por letra), com folga. */
export function larguraDoRotulo(rotulos: string[]): number {
  return Math.max(0, ...rotulos.map((r) => r.length)) * 6.2 + 8;
}

/**
 * De quantos em quantos rótulos do eixo x mostrar para não encavalar. Cada rótulo precisa do maior
 * entre `minimo` (o espaçamento de sempre do gráfico) e o tamanho dele ("out-25" pede mais que "out").
 * `peloMenos`: quantos rótulos cabem no mínimo, mesmo apertados.
 */
export function passoDosRotulos(
  rotulos: string[],
  larguraUtil: number,
  { minimo = 0, peloMenos = 1 }: { minimo?: number; peloMenos?: number } = {},
): number {
  const espaco = Math.max(minimo, larguraDoRotulo(rotulos));
  return Math.max(1, Math.ceil(rotulos.length / Math.max(peloMenos, Math.floor(larguraUtil / espaco))));
}
