import type { EstiloLinha, GraficoLinhas } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarEixo, formatarNaDica, margemEixo, useFoco } from './escala';
import { ticksRedondos } from './geometria';
import { useLargura } from './useLargura';
import './charts.css';

const CLASSE_LINHA: Record<EstiloLinha, string> = { principal: '', secundaria: 'l2', pontilhada: 'l3' };

interface Props {
  grafico: GraficoLinhas;
  aria: string;
  altura?: number;
}

/** Várias séries com área, média, marcadores e rótulo no fim de cada linha (lineChart do mockup). */
export function Linhas(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      {largura > 0 && props.grafico.rotulos.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

function Desenho({ grafico, aria, altura = 230, largura }: Props & { largura: number }) {
  const { rotulos, series, referencia, marcadores = [], piso } = grafico;
  const n = rotulos.length;
  const { foco, mover, sair } = useFoco(n, 'ponto');
  const eixo = formatarEixo(grafico);
  const naDica = formatarNaDica(grafico);
  // espaço à direita para o rótulo no fim da linha mais longo (12px ≈ 6,6px por letra)
  const maiorFim = Math.max(0, ...series.map((s) => s.rotuloFim?.length ?? 0));
  const comFim = maiorFim > 0;

  const W = Math.max(280, largura);
  const H = altura;
  const P = {
    l: margemEixo(grafico),
    r: comFim ? Math.max(64, Math.ceil(maiorFim * 6.6) + 14) : 20,
    t: 18,
    b: 30,
  };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;

  const todos = [
    ...series.flatMap((s) => s.valores.filter((v): v is number => v != null)),
    ...(referencia ? [referencia.valor] : []),
  ];
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
  const passo = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 52))));

  const caminhos = series.map((s) => {
    const pts: [number, number][] = [];
    s.valores.forEach((v, i) => {
      if (v != null) pts.push([x(i), y(v)]);
    });
    return pts;
  });
  const d = (pts: [number, number][]) =>
    'M' + pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L');
  const yBase = y(Math.max(lo, Math.min(0, hi)));

  // rótulos no fim das linhas, afastados para não se sobreporem
  const fins = series
    .map((s, k) => {
      const pts = caminhos[k] ?? [];
      const ultimo = pts[pts.length - 1];
      return s.rotuloFim && ultimo
        ? { texto: s.rotuloFim, x: ultimo[0] + 10, y: ultimo[1] + 4, principal: s.estilo === 'principal' }
        : null;
    })
    .filter((f) => f != null)
    .sort((a, b) => a.y - b.y);
  fins.forEach((f, i) => {
    const anterior = fins[i - 1];
    if (anterior && f.y - anterior.y < 15) f.y = anterior.y + 15;
  });

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="gl" x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} />
            <text className="ax" x={P.l - 8} y={y(t) + 4} textAnchor="end">
              {eixo(t)}
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
            <text className="reflabel" x={W - P.r} y={y(referencia.valor) - 6} textAnchor="end">
              {referencia.rotulo}
            </text>
          </>
        )}
        {series.map((s, k) => {
          const pts = caminhos[k] ?? [];
          if (pts.length === 0) return null;
          const primeiro = pts[0]!;
          const ultimo = pts[pts.length - 1]!;
          return (
            <g key={s.nome}>
              {s.area && (
                <path
                  className="area"
                  d={`${d(pts)}L${ultimo[0].toFixed(1)},${yBase}L${primeiro[0].toFixed(1)},${yBase}Z`}
                />
              )}
              <path className={`ln ${CLASSE_LINHA[s.estilo]}`} d={d(pts)} />
            </g>
          );
        })}
        {marcadores.map((m) => {
          const v = series[m.serie]?.valores[m.i];
          if (v == null) return null;
          const mx = x(m.i);
          const my = y(v);
          const ancora = mx > W - 140 ? 'end' : mx < P.l + 60 ? 'start' : 'middle';
          return (
            <g key={`${m.serie}-${m.i}`}>
              <circle className="mk" cx={mx} cy={my} r={4.5} />
              <text
                className="mklabel"
                x={mx + (ancora === 'end' ? -8 : ancora === 'start' ? 8 : 0)}
                y={my - 12}
                textAnchor={ancora}
              >
                {m.rotulo}
              </text>
            </g>
          );
        })}
        {fins.map((f) => (
          <text key={f.texto} className={`endlabel${f.principal ? ' main' : ''}`} x={f.x} y={f.y}>
            {f.texto}
          </text>
        ))}
        {foco && <line className="guide on" x1={x(foco.i)} x2={x(foco.i)} y1={P.t} y2={P.t + ih} />}
        <rect
          className="ov"
          x={P.l}
          y={P.t}
          width={iw}
          height={ih}
          fill="transparent"
          onMouseMove={mover}
          onMouseLeave={sair}
        />
      </svg>
      <Tooltip aberto={foco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
        {foco && (
          <>
            <b>{grafico.titulos?.[foco.i] ?? rotulos[foco.i]}</b>
            {series.map((s) => {
              const v = s.valores[foco.i];
              return v == null ? null : <LinhaDica key={s.nome} rotulo={s.nome} valor={naDica(v)} />;
            })}
          </>
        )}
      </Tooltip>
    </>
  );
}
