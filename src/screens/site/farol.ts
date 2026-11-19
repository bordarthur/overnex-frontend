import type { Faixa, Status } from '../../contracts/visaoGeral';

/*
 * Contas do farol interativo do site (FarolFuturo), portadas do mockup. É a única conta de negócio
 * feita no front, e só vale aqui: o site é público, não fala com a API e os números são ilustrativos,
 * fixos em conteudo.ts. No app, toda projeção vem pronta da API.
 */

/** O velocímetro de "Vendas contra a meta" do mockup: 80% a 110%, meta em 100%. */
export const VELOCIMETRO_VENDAS = {
  min: 80,
  max: 110,
  meta: 100,
  faixas: [
    { de: 80, ate: 90, status: 'critico' },
    { de: 90, ate: 100, status: 'atencao' },
    { de: 100, ate: 110, status: 'saudavel' },
  ] as Faixa[],
};

/** Vendas acumuladas até cada dia útil. */
export function acumular(vendas: number[]): number[] {
  let soma = 0;
  return vendas.map((v) => (soma += v));
}

export interface Projecao {
  vendido: number;
  projecao: number;
  pct: number;
  status: Status;
  /** quanto falta vender por dia útil para chegar na meta (no último dia, 0) */
  faltaPorDia: number;
  /** diferença entre a projeção e a meta, sem sinal */
  distancia: number;
}

/** No dia útil `dia` (1 a diasUteis): o ritmo de hoje levado até o fim do mês, contra a meta. */
export function projetar(acumulado: number[], dia: number, diasUteis: number, meta: number): Projecao {
  const vendido = acumulado[dia - 1] ?? 0;
  const projecao = (vendido / dia) * diasUteis;
  const pct = (projecao / meta) * 100;
  const status: Status = pct >= 100 ? 'saudavel' : pct >= 90 ? 'atencao' : 'critico';
  const faltaPorDia = dia < diasUteis ? (meta - vendido) / (diasUteis - dia) : 0;
  return { vendido, projecao, pct, status, faltaPorDia, distancia: Math.abs(projecao - meta) };
}

/**
 * A escadinha do gráfico: o acumulado de cada dia útil, de 0 até `dias`, numa caixa W×H.
 * `x(d)` e `y(v)` levam dia e valor para a caixa.
 */
export function escadinha(
  acumulado: number[],
  dias: number,
  x: (d: number) => number,
  y: (v: number) => number,
) {
  let d = `M${x(0)},${y(0)}`;
  for (let i = 0; i < dias; i++) {
    const v = acumulado[i] ?? 0;
    d += `L${x(i).toFixed(1)},${y(v).toFixed(1)}L${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`;
  }
  return d;
}

/**
 * O feixe do hero: vendas acumuladas dos 13 primeiros dias úteis, com os fins de semana planos
 * (5 dias andam, 2 ficam), numa caixa W×H. Devolve o caminho e o ponto final.
 */
export function feixe(vendas: number[], W: number, H: number) {
  const v = vendas.slice(0, 13);
  const total = v.reduce((a, b) => a + b, 0);
  const passo = (W * 0.9) / 17;
  const Y = (a: number) => (H - (a / total) * H * 0.8).toFixed(1);
  let soma = 0;
  let x = 0;
  let dia = 0;
  let k = 0;
  let d = `M0,${H}`;
  while (dia < v.length) {
    if (k % 7 < 5) {
      soma += v[dia++] ?? 0;
      d += `L${x.toFixed(1)},${Y(soma)}`;
    }
    x += passo;
    d += `L${x.toFixed(1)},${Y(soma)}`;
    k++;
  }
  return { d, x, y: Number(Y(soma)) };
}
