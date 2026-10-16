import type { Status } from '../contracts/visaoGeral';
import { STATUS } from '../theme/status';
import { useLargura } from './useLargura';
import './MiniTendencia.css';

interface PropsMiniTendencia {
  rotulos: string[];
  real: number[];
  referencia: number[];
  faixa?: [number, number];
  status: Status;
  formatar: (v: number) => string;
}

// Medidas do miniTrend do mockup.
const H = 58;
const P = { l: 2, r: 48, t: 8, b: 16 };

/** Minitendência de 6 meses: linha real, referência tracejada, faixa saudável e o último ponto na cor do status. */
export function MiniTendencia({ rotulos, real, referencia, faixa, status, formatar }: PropsMiniTendencia) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="mt" ref={ref}>
      {largura > 0 && real.length > 1 && (
        <Desenho {...{ rotulos, real, referencia, faixa, status, formatar }} largura={largura} />
      )}
    </div>
  );
}

function Desenho({
  rotulos,
  real,
  referencia,
  faixa,
  status,
  formatar,
  largura: w,
}: PropsMiniTendencia & { largura: number }) {
  const n = real.length;
  const iw = w - P.l - P.r;
  const ih = H - P.t - P.b;
  const todos = [...real, ...referencia];
  let lo = Math.min(...todos);
  let hi = Math.max(...todos);
  const sp = hi - lo || 1;
  lo -= sp * 0.15;
  hi += sp * 0.15;
  const x = (i: number) => P.l + (i * iw) / (n - 1);
  const y = (v: number) => P.t + ih - ((v - lo) / (hi - lo)) * ih;
  const pontos = (a: number[]) => a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ultimo = real[n - 1] ?? 0;

  let faixaRect = null;
  if (faixa) {
    const topo = y(Math.min(faixa[1], hi));
    const base = y(Math.max(faixa[0], lo));
    if (base > topo)
      faixaRect = <rect className="mt-band" x={P.l} y={topo} width={iw} height={base - topo} rx={3} />;
  }

  return (
    <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} aria-hidden="true">
      {faixaRect}
      <polyline className="mt-ref" points={pontos(referencia)} />
      <polyline className="mt-real" points={pontos(real)} />
      {real.map((v, i) =>
        i === n - 1 ? (
          <circle key={i} className={`mt-last ${STATUS[status].classe}`} cx={x(i)} cy={y(v)} r={3.6} />
        ) : (
          <circle key={i} className="mt-dot" cx={x(i)} cy={y(v)} r={1.8} />
        ),
      )}
      <text className="mt-vl" x={x(n - 1) + 7} y={y(ultimo) + 4}>
        {formatar(ultimo)}
      </text>
      <text className="mt-lab" x={P.l} y={H - 3}>
        {rotulos[0]}
      </text>
      <text className="mt-lab" x={x(n - 1)} y={H - 3} textAnchor="middle">
        {rotulos[n - 1]}
      </text>
    </svg>
  );
}
