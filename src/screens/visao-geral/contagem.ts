import type { Status } from '../../contracts/visaoGeral';

/** Quantos itens (velocímetros e cartões) estão em cada status. Só conta o que a API já classificou. */
export function contarPorStatus(status: (Status | null | undefined)[]): Record<Status, number> {
  const contagem: Record<Status, number> = { critico: 0, atencao: 0, saudavel: 0 };
  for (const s of status) if (s) contagem[s] += 1;
  return contagem;
}
