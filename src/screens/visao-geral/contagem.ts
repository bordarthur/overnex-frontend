import type { Indicador, PeriodoId, Status } from '../../contracts/visaoGeral';

/** Quantos indicadores estão em cada status no período. Só conta o que a API já classificou. */
export function contarPorStatus(indicadores: Indicador[], periodo: PeriodoId): Record<Status, number> {
  const contagem: Record<Status, number> = { critico: 0, atencao: 0, saudavel: 0 };
  for (const ind of indicadores) contagem[ind.periodos[periodo].status] += 1;
  return contagem;
}
