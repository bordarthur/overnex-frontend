import { useState, type MouseEvent } from 'react';
import type { Escala } from '../contracts/painel';
import { formatarRotulo, formatarValor } from '../format';

/** Rótulo curto de eixo e de ponto ("6,5 mi", "34%", "120 t"). */
export function formatarEixo(e: Escala): (v: number) => string {
  return (v) => formatarRotulo(v, e.unidade, e.casas) + (e.sufixo ? ` ${e.sufixo}` : '');
}

/** Valor por extenso, para a dica ("R$ 6,54 mi", "1.040 clientes"). */
export function formatarNaDica(e: Escala): (v: number) => string {
  return (v) =>
    formatarValor({ valor: v, unidade: e.unidade, casas: e.casas, casasMil: e.casasMil, sufixo: e.sufixo });
}

/** Margem esquerda do gráfico: reais precisam de mais espaço para o rótulo do eixo. */
export const margemEixo = (e: Escala) => (e.unidade === 'brl' ? 56 : 40);

export interface Foco {
  i: number;
  x: number;
  y: number;
}

/** Ponto em foco sob o mouse (para a dica), a partir da posição horizontal na área do gráfico. */
export function useFoco(n: number, modo: 'ponto' | 'faixa') {
  const [foco, setFoco] = useState<Foco | null>(null);
  const mover = (e: MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    // ponto: o mais perto (linhas); faixa: a coluna sob o mouse (barras)
    const bruto = modo === 'ponto' ? Math.round(rel * (n - 1)) : Math.floor(rel * n);
    setFoco({ i: Math.max(0, Math.min(n - 1, bruto)), x: e.clientX, y: e.clientY });
  };
  return { foco, mover, sair: () => setFoco(null) };
}
