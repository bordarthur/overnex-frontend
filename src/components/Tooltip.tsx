import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

interface PropsTooltip {
  aberto: boolean;
  /** posição do ponteiro, em coordenadas da janela */
  x: number;
  y: number;
  children: ReactNode;
}

/**
 * Dica flutuante dos gráficos (showTip do mockup): acima e à direita do ponteiro, virando de lado perto das bordas.
 * É um complemento visual do mouse; os gráficos já têm aria-label com o resumo.
 */
export function Tooltip({ aberto, x, y, children }: PropsTooltip) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !aberto) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = x + 14;
    let top = y - h - 12;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  });

  return createPortal(
    <div ref={ref} className={`tip${aberto ? ' on' : ''}`} aria-hidden="true">
      {children}
    </div>,
    document.body,
  );
}

/** Linha "rótulo ... valor" dentro da dica. */
export function LinhaDica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="r">
      <span>{rotulo}</span>
      <span>{valor}</span>
    </div>
  );
}
