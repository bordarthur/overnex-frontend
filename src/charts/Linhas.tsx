import type { EstiloLinha, GraficoLinhas } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarEixo, formatarNaDica, margemEixo, useFoco } from './escala';
import { passoDosRotulos, ticksRedondos } from './geometria';
import { colocarRotulos } from './rotulosMarcas';
import { useLargura } from './useLargura';
import './charts.css';

const CLASSE_LINHA: Record<EstiloLinha, string> = { principal: '', secundaria: 'l2', pontilhada: 'l3' };
// espaço em cima do gráfico, e até quanto ele cresce para caberem os rótulos dos pontos marcados
const TOPO = 18;
const TOPO_EXTRA = 45;
// o mais alto que a linha de base de um rótulo chega (12px de letra)
const TOPO_ROTULO = 12;

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
    t: TOPO,
    b: 30,
  };
  const iw = W - P.l - P.r;

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
  const passo = passoDosRotulos(rotulos, iw, { minimo: 52, peloMenos: 2 });

  // a escala do y depende do topo do desenho, que cresce quando os rótulos dos pontos marcados não
  // cabem acima da linha (dois empilhados num gráfico estreito)
  const montar = (topo: number) => {
    const ih = H - topo - P.b;
    const y = (v: number) => topo + ih - ((v - lo) / (hi - lo)) * ih;
    const caminhos = series.map((s) => {
      const pts: [number, number][] = [];
      s.valores.forEach((v, i) => {
        if (v != null) pts.push([x(i), y(v)]);
      });
      return pts;
    });
    const marcas = marcadores.flatMap((m) => {
      const v = series[m.serie]?.valores[m.i];
      if (v == null) return [];
      const linha = caminhos[m.serie] ?? [];
      return [{ chave: `${m.serie}-${m.i}`, mx: x(m.i), my: y(v), texto: m.rotulo, linha }];
    });
    return { ih, y, caminhos, marcas, rotulosMarcas: colocarRotulos(marcas, P.l, W) };
  };
  let montado = montar(P.t);
  for (let k = 0; k < 4 && P.t < TOPO + TOPO_EXTRA; k++) {
    const falta = TOPO_ROTULO - Math.min(...montado.rotulosMarcas.map((r) => r.y));
    if (!(falta > 0)) break;
    P.t = Math.min(TOPO + TOPO_EXTRA, P.t + Math.ceil(falta) + 1);
    montado = montar(P.t);
  }
  const { ih, y, caminhos, marcas, rotulosMarcas } = montado;
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
          // `minimo`: laranja, com o rótulo à esquerda (caixa mínimo); `media`: cinza, à direita
          <>
            <line
              className={referencia.estilo === 'minimo' ? 'ref min' : 'ref'}
              x1={P.l}
              x2={W - P.r}
              y1={y(referencia.valor)}
              y2={y(referencia.valor)}
            />
            <text
              className={referencia.estilo === 'minimo' ? 'reflabel min' : 'reflabel'}
              x={referencia.estilo === 'minimo' ? P.l + 8 : W - P.r}
              y={y(referencia.valor) - 6}
              textAnchor={referencia.estilo === 'minimo' ? 'start' : 'end'}
            >
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
        {marcas.map((m, k) => {
          // sempre acima da linha (ver colocarRotulos)
          const r = rotulosMarcas[k]!;
          return (
            <g key={m.chave}>
              <circle className="mk" cx={m.mx} cy={m.my} r={4.5} />
              <text className="mklabel" x={r.x} y={Math.max(TOPO_ROTULO, r.y)} textAnchor={r.ancora}>
                {m.texto}
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
