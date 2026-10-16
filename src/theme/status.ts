import type { Status } from '../contracts/visaoGeral';

/** Classe CSS (ok/warn/crit, como no mockup) e rótulo de cada status. A ordem é a de exibição: o pior primeiro. */
export const STATUS: Record<Status, { classe: 'ok' | 'warn' | 'crit'; rotulo: string }> = {
  critico: { classe: 'crit', rotulo: 'Crítico' },
  atencao: { classe: 'warn', rotulo: 'Atenção' },
  saudavel: { classe: 'ok', rotulo: 'Saudável' },
};

export const ORDEM_STATUS: Status[] = ['critico', 'atencao', 'saudavel'];
