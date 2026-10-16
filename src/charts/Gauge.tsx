import { useEffect, useState } from 'react';
import type { Faixa, Unidade } from '../contracts/visaoGeral';
import { formatarEscala } from '../format';
import { STATUS } from '../theme/status';
import { anguloPonteiro, anguloRad, pontoPolar } from './geometria';
import './Gauge.css';

// Medidas do velocímetro do mockup (gaugeSVG).
const W = 300;
const H = 168;
const CX = 150;
const CY = 136;
const R = 104;
const ESPESSURA = 26;

interface PropsGauge {
  min: number;
  max: number;
  meta: number;
  unidade: Unidade;
  faixas: Faixa[];
  ponteiro: number;
  /** "nome: valor, referência" */
  rotuloAria: string;
}

export function Gauge({ min, max, meta, unidade, faixas, ponteiro, rotuloAria }: PropsGauge) {
  // Na montagem o ponteiro parte do mínimo e anda até o valor; depois, anima a cada troca de período.
  // Com prefers-reduced-motion o CSS desliga a transição e ele aparece direto no lugar.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    let segundo = 0;
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setMontado(true));
    });
    return () => {
      cancelAnimationFrame(primeiro);
      cancelAnimationFrame(segundo);
    };
  }, []);

  const ang = (v: number) => anguloRad(v, min, max);
  const graus = montado ? anguloPonteiro(ponteiro, min, max) : 0;
  const [m0x, m0y] = pontoPolar(CX, CY, R - ESPESSURA / 2 - 6, ang(meta));
  const [m1x, m1y] = pontoPolar(CX, CY, R + ESPESSURA / 2 + 4, ang(meta));
  const comprimento = R - ESPESSURA / 2 - 12;

  return (
    <svg className="gauge" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={rotuloAria}>
      {faixas.map((f) => {
        const [x0, y0] = pontoPolar(CX, CY, R, ang(f.de));
        const [x1, y1] = pontoPolar(CX, CY, R, ang(f.ate));
        return (
          <path
            key={`${f.de}-${f.ate}`}
            className={`gz ${STATUS[f.status].classe}`}
            d={`M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}`}
            strokeWidth={ESPESSURA}
          />
        );
      })}
      {faixas.slice(0, -1).map((f) => {
        const a = ang(f.ate);
        const [s0, s1] = pontoPolar(CX, CY, R - ESPESSURA / 2, a);
        const [e0, e1] = pontoPolar(CX, CY, R + ESPESSURA / 2, a);
        const [lx, ly] = pontoPolar(CX, CY, R + ESPESSURA / 2 + 13, a);
        const ancora = Math.cos(a) > 0.25 ? 'start' : Math.cos(a) < -0.25 ? 'end' : 'middle';
        return (
          <g key={`div-${f.ate}`}>
            <line className="gsep" x1={s0} y1={s1} x2={e0} y2={e1} />
            <text className="gb" x={lx} y={(ly + 4).toFixed(1)} textAnchor={ancora}>
              {formatarEscala(f.ate, unidade, 'divisao')}
            </text>
          </g>
        );
      })}
      <line className="gt" x1={m0x} y1={m0y} x2={m1x} y2={m1y} />
      <g className="gneedle" style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${graus}deg)` }}>
        <path className="gn" d={`M${CX},${CY - 4.5} L${CX - comprimento},${CY} L${CX},${CY + 4.5} Z`} />
      </g>
      <circle className="gh" cx={CX} cy={CY} r={9} />
      <circle className="ghi" cx={CX} cy={CY} r={3.5} />
      <text className="gs" x={CX - R} y={CY + 26} textAnchor="middle">
        {formatarEscala(min, unidade, 'inicio')}
      </text>
      <text className="gs" x={CX + R} y={CY + 26} textAnchor="middle">
        {formatarEscala(max, unidade, 'fim')}
      </text>
    </svg>
  );
}

/** Legenda das faixas do velocímetro (gaugeLegend do mockup): "Crítico até 90%", "Atenção 90% a 100%"... */
export function LegendaGauge({ faixas, unidade }: { faixas: Faixa[]; unidade: Unidade }) {
  const fmt = (v: number) => formatarEscala(v, unidade, 'divisao');
  return (
    <div className="gleg">
      {faixas.map((f, i) => {
        const texto =
          i === 0
            ? `até ${fmt(f.ate)}`
            : i === faixas.length - 1
              ? `acima de ${fmt(f.de)}`
              : `${fmt(f.de)} a ${fmt(f.ate)}`;
        return (
          <span key={`${f.de}-${f.ate}`} className={`gl-${STATUS[f.status].classe}`}>
            <i aria-hidden="true" />
            {STATUS[f.status].rotulo} {texto}
          </span>
        );
      })}
    </div>
  );
}
