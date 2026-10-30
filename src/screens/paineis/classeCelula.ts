import type { Celula } from '../../contracts/painel';
import { STATUS } from '../../theme/status';

/** Classes do farol, do tom e do negrito de uma célula (tabela e lista com detalhe). */
export function classeCelula(c: Celula): string {
  const classes: string[] = [];
  if (c.fundo) classes.push(`cf-${STATUS[c.fundo].classe}`);
  if (c.tom) classes.push(c.tom === 'apagado' ? 'muted' : `t-${STATUS[c.tom].classe}`);
  if (c.negrito) classes.push('forte');
  return classes.join(' ');
}
