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
