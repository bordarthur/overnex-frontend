import type { Unidade, Valor } from '../contracts/visaoGeral';

// Formatação pt-BR. Só apresenta números que já vêm prontos da API; não calcula nada de negócio.

/** Sinal de menos tipográfico (U+2212), como no mockup. */
export const MENOS = '−';

const formatadores = new Map<number, Intl.NumberFormat>();

/** Intl.NumberFormat pt-BR com número fixo de casas (equivale a nf0, nf1 e nf2 do mockup). */
export function nf(casas: number): Intl.NumberFormat {
  let f = formatadores.get(casas);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
    formatadores.set(casas, f);
  }
  return f;
}

const sinal = (v: number, comSinal: boolean) => (v < 0 ? MENOS : comSinal && v > 0 ? '+' : '');
const numero = (v: number) => (Number.isInteger(v) ? nf(0) : nf(1)).format(Math.abs(v));

interface OpcoesMoeda {
  casas?: number;
  compacto?: boolean;
  comSinal?: boolean;
}

/** Porta `money` do mockup: R$ 6,54 mi, R$ 360 mil, R$ 950. Com `compacto: false`: R$ 2.995. */
export function formatarMoeda(
  v: number,
  { casas, compacto = true, comSinal = false }: OpcoesMoeda = {},
): string {
  const a = Math.abs(v);
  let s: string;
  if (!compacto) s = 'R$ ' + nf(casas ?? 0).format(a);
  else if (a >= 1e6) s = 'R$ ' + nf(casas ?? 2).format(a / 1e6) + ' mi';
  else if (a >= 1e3) s = 'R$ ' + nf(0).format(Math.round(a / 1e3)) + ' mil';
  else s = 'R$ ' + nf(0).format(a);
  return sinal(v, comSinal) + s;
}

/** Porta `axisMoney` do mockup: 6,5 mi, 360 mil, 0 (sem "R$"). */
export function formatarEixoMoeda(v: number): string {
  const a = Math.abs(v);
  const s = a >= 1e6 ? nf(1).format(a / 1e6) + ' mi' : a >= 1e3 ? nf(0).format(a / 1e3) + ' mil' : '0';
  return (v < 0 ? MENOS : '') + s;
}

/** Porta `pct` do mockup: 7,4%. */
export function formatarPct(v: number, casas = 1): string {
  return sinal(v, false) + nf(casas).format(Math.abs(v)) + '%';
}

/** Um formatador por unidade, para valores e deltas. */
export function formatarValor(valor: Valor, { comSinal = false }: { comSinal?: boolean } = {}): string {
  const { valor: v, unidade, casas, compacto, sufixo } = valor;
  const a = Math.abs(v);
  let s: string;
  switch (unidade) {
    case 'brl':
      s = formatarMoeda(v, { casas, compacto, comSinal });
      break;
    case 'pct':
      s = sinal(v, comSinal) + nf(casas ?? 1).format(a) + '%';
      break;
    case 'pp':
      s = sinal(v, comSinal) + nf(casas ?? 1).format(a) + ' p.p.';
      break;
    case 'dias': {
      const n = nf(casas ?? 0).format(a);
      s = sinal(v, comSinal) + n + (n === '1' ? ' dia' : ' dias');
      break;
    }
    case 'vezes':
      s = sinal(v, comSinal) + nf(casas ?? 2).format(a) + 'x';
      break;
    case 'qtd':
      s = sinal(v, comSinal) + nf(casas ?? 0).format(a);
      break;
  }
  return sufixo ? `${s} ${sufixo}` : s;
}

/** Número a formatar pela unidade, ou texto que a API já mandou pronto ("2 de 6"). */
export function formatarExibicao(v: Valor | string, opcoes: { comSinal?: boolean } = {}): string {
  return typeof v === 'string' ? v : formatarValor(v, opcoes);
}

/** Delta de um indicador: com sinal; zero vira "na média". */
export function formatarDelta(delta: Valor): string {
  return delta.valor === 0 ? 'na média' : formatarValor(delta, { comSinal: true });
}

export type PosicaoEscala = 'inicio' | 'divisao' | 'fim';

/**
 * Rótulos do velocímetro. Como no mockup: "80%", "0,61x", "3,5x"; em dias, o início vai só com o número,
 * as divisões com "d" ("8 d") e o fim por extenso ("24 dias").
 */
export function formatarEscala(v: number, unidade: Unidade, posicao: PosicaoEscala): string {
  const n = sinal(v, false) + numero(v);
  switch (unidade) {
    case 'pct':
      return n + '%';
    case 'pp':
      return n + ' p.p.';
    case 'vezes':
      return n + 'x';
    case 'dias':
      return posicao === 'inicio' ? n : posicao === 'divisao' ? n + ' d' : n + ' dias';
    case 'brl':
      return formatarEixoMoeda(v);
    case 'qtd':
      return n;
  }
}

/**
 * Rótulos curtos de gráfico (eixos, último ponto da minitendência): "6,54 mi", "R$ 2.995", "7,4%", "7 d", "0,61x".
 * Em reais: milhões e milhares compactos sem "R$"; valores abaixo de 10 mil por extenso, com "R$".
 */
export function formatarRotulo(v: number, unidade: Unidade, casas?: number): string {
  const a = Math.abs(v);
  const s = sinal(v, false);
  switch (unidade) {
    case 'brl':
      if (a >= 1e6) return s + nf(casas ?? 1).format(a / 1e6) + ' mi';
      if (a >= 1e4) return s + nf(0).format(a / 1e3) + ' mil';
      return s + 'R$ ' + nf(casas ?? 0).format(a);
    case 'pct':
      return s + nf(casas ?? 1).format(a) + '%';
    case 'pp':
      return s + nf(casas ?? 1).format(a) + ' p.p.';
    case 'dias':
      return s + nf(casas ?? 0).format(a) + ' d';
    case 'vezes':
      return s + nf(casas ?? 2).format(a) + 'x';
    case 'qtd':
      return s + nf(casas ?? 0).format(a);
  }
}
