import type { ReactNode } from 'react';
import type { IdQuadranteBcg } from '../contracts/painel';

// Ícones dos quadrantes da Matriz BCG (mockup M3.1.0): estrela, vaca, interrogação e abacaxi.
const DESENHOS: Record<IdQuadranteBcg, ReactNode> = {
  estrela: <path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z" />,
  'vaca-leiteira': (
    <>
      <path d="M7.5 8.5C5.6 8.7 4 7.6 3.5 6c1.6-.2 3 .2 4.2 1M16.5 8.5c1.9.2 3.5-.9 4-2.5-1.6-.2-3 .2-4.2 1" />
      <path d="M7.5 7.5h9c.8 0 1.4.6 1.4 1.4V14a4 4 0 01-4 4h-3.8a4 4 0 01-4-4V8.9c0-.8.6-1.4 1.4-1.4z" />
      <ellipse cx="12" cy="15.2" rx="3.3" ry="2.1" />
      <path d="M10.6 15.2h.01M13.4 15.2h.01M9.5 10.6h.01M14.5 10.6h.01" />
    </>
  ),
  interrogacao: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M9.6 9.4a2.5 2.5 0 014.9.6c0 1.7-2.5 2.2-2.5 3.8" />
      <path d="M12 16.9h.01" />
    </>
  ),
  abacaxi: (
    <>
      <path d="M12 8.5c-3 0-5 2.6-5 6s2 6 5 6 5-2.6 5-6-2-6-5-6z" />
      <path d="M9 11.5l6 6M15 11.5l-6 6" />
      <path d="M12 8.5V5M12 6.5l-3-3M12 6.5l3-3" />
    </>
  ),
};

interface Props {
  quadrante: IdQuadranteBcg;
  tamanho: number;
  /** posição dentro de um SVG (os cantos da matriz) */
  x?: number;
  y?: number;
}

/** O ícone do quadrante, em traço (cor pelo `color` de quem usa). */
export function IconeQuadrante({ quadrante, tamanho, x, y }: Props) {
  return (
    <svg
      x={x}
      y={y}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {DESENHOS[quadrante]}
    </svg>
  );
}
