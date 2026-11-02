/**
 * Velocímetros por linha da grade. Até 4, uma linha só, dividindo a largura toda. De 5 a 8, duas
 * linhas com a de cima igual ou maior (5 = 3 + 2, 6 = 3 + 3, 7 = 4 + 3, 8 = 4 + 4). Acima disso, 4.
 */
export function colunasDaGrade(n: number): number {
  if (n <= 4) return n;
  if (n <= 8) return Math.ceil(n / 2);
  return 4;
}
