import { useId, useState, type MouseEvent, type ReactNode } from 'react';
import { Tooltip } from '../components/Tooltip';
import { useMovimentoReduzido } from '../theme/useTema';
import { ticksRedondos } from './geometria';
import { useLargura } from './useLargura';
import './charts.css';

interface PropsLinha {
  rotulos: string[];
  valores: number[];
  formatarEixo: (v: number) => string;
  aria: string;
  altura?: number;
  padL?: number;
  padR?: number;
  /** espaço mínimo entre rótulos do eixo x, em px */
  xGap?: number;
  /** inclui este valor na escala (ex.: 0) */
  piso?: number;
  referencia?: { valor: number; rotulo?: string };
  marcadores?: { i: number; rotulo?: string }[];
  dica?: (i: number) => ReactNode;
  /** desenha a linha da esquerda para a direita na primeira exibição */
  animar?: boolean;
}

/** Gráfico de linha com média e marcador (lineChart do mockup, só com o que a Visão geral usa). */
export function Linha(props: PropsLinha) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      {largura > 0 && props.valores.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

function Desenho({
  rotulos,
  valores,
  formatarEixo,
  aria,
  altura = 270,
  padL = 56,
  padR = 20,
  xGap = 52,
  piso,
  referencia,
  marcadores = [],
  dica,
  animar = false,
  largura,
}: PropsLinha & { largura: number }) {
  const reduz = useMovimentoReduzido();
  // A animação só vale para a primeira pintura; depois a largura acompanha o redimensionamento.
  const [desenhar] = useState(animar && !reduz);
  const [foco, setFoco] = useState<{ i: number; x: number; y: number } | null>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const W = Math.max(280, largura);
  const H = altura;
  const P = { l: padL, r: padR, t: 18, b: 30 };
  const n = rotulos.length;
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;

  const todos = [...valores, ...(referencia ? [referencia.valor] : [])];
  let lo = Math.min(...todos);
  let hi = Math.max(...todos);
  if (piso != null) lo = Math.min(lo, piso);
  const sp = hi - lo || 1;
  lo -= sp * 0.06;
  hi += sp * 0.1;
  const ticks = ticksRedondos(lo, hi, 4);
  lo = Math.min(lo, ticks[0] ?? lo);
  hi = Math.max(hi, ticks[ticks.length - 1] ?? hi);
  const x = (i: number) => P.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => P.t + ih - ((v - lo) / (hi - lo)) * ih;
  const passo = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / xGap))));
  const d = 'M' + valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('L');

  const mover = (e: MouseEvent<SVGRectElement>) => {
    if (!dica) return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))));
    setFoco({ i, x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <defs>
          <clipPath id={`${id}r`}>
            <rect x={0} y={0} width={desenhar ? 0 : W} height={H}>
              {desenhar && (
                <animate
                  attributeName="width"
                  from="0"
                  to={W}
                  dur="0.9s"
                  fill="freeze"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines=".2 .7 .2 1"
                />
              )}
            </rect>
          </clipPath>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line className="gl" x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} />
            <text className="ax" x={P.l - 8} y={y(t) + 4} textAnchor="end">
              {formatarEixo(t)}
            </text>
          </g>
        ))}
        {rotulos.map((r, i) =>
          i % passo === 0 ? (
            <text key={i} className="ax" x={x(i)} y={H - 8} textAnchor="middle">
              {r}
            </text>
          ) : null,
        )}
        {referencia && (
          <>
            <line className="ref" x1={P.l} x2={W - P.r} y1={y(referencia.valor)} y2={y(referencia.valor)} />
            {referencia.rotulo && (
              <text className="reflabel" x={W - P.r} y={y(referencia.valor) - 6} textAnchor="end">
                {referencia.rotulo}
              </text>
            )}
          </>
        )}
        <g clipPath={`url(#${id}r)`}>
          <path className="ln" d={d} />
          {marcadores.map((m) => {
            const v = valores[m.i];
            if (v == null) return null;
            const mx = x(m.i);
            const my = y(v);
            const ancora = mx > W - 140 ? 'end' : mx < P.l + 60 ? 'start' : 'middle';
            return (
              <g key={m.i}>
                <circle className="mk" cx={mx} cy={my} r={4.5} />
                {m.rotulo && (
                  <text
                    className="mklabel"
                    x={mx + (ancora === 'end' ? -8 : ancora === 'start' ? 8 : 0)}
                    y={my - 12}
                    textAnchor={ancora}
                  >
                    {m.rotulo}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        {foco && <line className="guide on" x1={x(foco.i)} x2={x(foco.i)} y1={P.t} y2={P.t + ih} />}
        <rect
          className="ov"
          x={P.l}
          y={P.t}
          width={iw}
          height={ih}
          fill="transparent"
          onMouseMove={mover}
          onMouseLeave={() => setFoco(null)}
        />
      </svg>
      {dica && (
        <Tooltip aberto={foco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
          {foco && dica(foco.i)}
        </Tooltip>
      )}
    </>
  );
}
