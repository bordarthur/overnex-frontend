// O campo do valor usado das provisões trabalha em milhares de reais, sem separador de milhar
// ("6400", "62,5"); a API recebe e manda reais.
const milhares = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, useGrouping: false });

/** Reais para o texto do campo, em milhares. */
export const paraCampo = (reais: number) => milhares.format(reais / 1000);

/** Texto do campo (em milhares) para reais; null quando não é um número de zero para cima. */
export function lerCampo(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, '');
  if (!/^\d+([.,]\d+)?$/.test(limpo)) return null;
  return Math.round(Number(limpo.replace(',', '.')) * 1000);
}
