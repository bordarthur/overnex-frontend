import type { Rotulado } from '../../contracts/gestao';

/**
 * A etiqueta do nível do painel ("Universal Básico", "Universal Completo", "Módulo Distribuidora"),
 * com o rótulo da API. A cor vai pela posição do nível em `niveis` (o primeiro, o segundo...), sem
 * nome de nível fixo aqui; nível que não está na lista fica sem etiqueta.
 */
export function EtiquetaNivel({ nivel, niveis }: { nivel: string; niveis: Rotulado[] }) {
  const i = niveis.findIndex((n) => n.id === nivel);
  const achado = niveis[i];
  if (!achado) return null;
  return <span className={`gst-etiqueta nivel-${i % 3}`}>{achado.rotulo}</span>;
}
