import type { CSSProperties } from 'react';

/**
 * Estilo do número que não pode quebrar nem vazar do cartão: junto com a classe `.cabe` (base.css),
 * a fonte encolhe pelo tamanho do texto até ele caber na largura do contêiner. Com os valores
 * cheios, "R$ 13.876.873" tem quase o dobro de caracteres de "R$ 13,88 mi".
 */
export function caber(texto: string): CSSProperties {
  return { '--car': texto.length } as CSSProperties;
}
