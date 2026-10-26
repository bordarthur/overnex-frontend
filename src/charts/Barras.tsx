import type { EstiloBarra, GraficoBarras } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarEixo, formatarNaDica, margemEixo, useFoco } from './escala';
import { ticksRedondos } from './geometria';
import { useLargura } from './useLargura';
import './charts.css';

const CLASSE_BARRA: Record<EstiloBarra, string> = {
  saudavel: 'okb',
  atencao: 'warnb',
  critico: 'critb',
  serie: '',
  'serie-media': 'sb1',
  'serie-clara': 'sb3',
  fantasma: 'ghost',
  projecao: 'projb',
};

interface Props {
  grafico: GraficoBarras;
  aria: string;
  altura?: number;
}

/** Barras agrupadas com linhas de referência (barChart do mockup). */
export function Barras(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      {largura > 0 && props.grafico.grupos.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

function Desenho({ grafico, aria, altura = 240, largura }: Props & { largura: number }) {
  const { grupos, referencias = [] } = grafico;
  const n = grupos.length;
  const { foco, mover, sair } = useFoco(n, 'faixa');
  const eixo = formatarEixo(grafico);
  const naDica = formatarNaDica(grafico);

  const W = Math.max(280, largura);
  const H = altura;
  const P = { l: margemEixo(grafico), r: 14, t: grafico.rotulosNasBarras ? 22 : 16, b: 28 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;

  const valores = [
    0,
    ...grupos.flatMap((g) => g.barras.map((b) => b.valor)),
    ...referencias.map((r) => r.valor),
  ];
  let lo = Math.min(...valores);
  let hi = Math.max(...valores);
  const sp = hi - lo || 1;
  hi += sp * 0.08;
  if (lo < 0) lo -= sp * 0.06;
  const ticks = ticksRedondos(lo, hi, 4);
  lo = Math.min(lo, ticks[0] ?? lo);
  hi = Math.max(hi, ticks[ticks.length - 1] ?? hi);
  const y = (v: number) => P.t + ih - ((v - lo) / (hi - lo)) * ih;
  const slot = iw / n;
  const passo = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 44))));
  const grupoFoco = foco ? grupos[foco.i] : undefined;

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'ref zero' : 'gl'} x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} />
            <text className="ax" x={P.l - 8} y={y(t) + 4} textAnchor="end">
              {eixo(t)}
            </text>
          </g>
        ))}
        {grupos.map((g, i) => {
          const k = g.barras.length;
          const bw = Math.min(26, (slot * 0.7) / k);
          const x0 = P.l + slot * i + (slot - bw * k - 2 * (k - 1)) / 2;
          return (
            <g key={i}>
              {g.barras.map((b, j) => {
                const topo = y(Math.max(0, b.valor));
                const base = y(Math.min(0, b.valor));
                const bx = x0 + j * (bw + 2);
                return (
                  <g key={j}>
                    <rect
                      className={`bar ${CLASSE_BARRA[b.estilo]}`}
                      x={bx}
                      y={topo}
                      width={bw}
                      height={Math.max(1, base - topo)}
                      rx={3}
                    />
                    {grafico.rotulosNasBarras && (
                      <text className="bvl" x={bx + bw / 2} y={topo - 4} textAnchor="middle">
                        {eixo(b.valor)}
                      </text>
                    )}
                  </g>
                );
              })}
              {i % passo === 0 && (
                <text className="ax" x={P.l + slot * i + slot / 2} y={H - 8} textAnchor="middle">
                  {g.rotulo}
                </text>
              )}
            </g>
          );
        })}
        {referencias.map((r) => (
          <line
            key={r.nome}
            className={`ref${r.estilo === 'minimo' ? ' min' : ''}`}
            x1={P.l}
            x2={W - P.r}
            y1={y(r.valor)}
            y2={y(r.valor)}
          />
        ))}
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
      <Tooltip aberto={grupoFoco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
        {grupoFoco && (
          <>
            <b>{grupoFoco.titulo ?? grupoFoco.rotulo}</b>
            {grupoFoco.barras.map((b) => (
              <LinhaDica key={b.nome} rotulo={b.nome} valor={naDica(b.valor)} />
            ))}
            {referencias.map((r) => (
              <LinhaDica key={r.nome} rotulo={r.nome} valor={naDica(r.valor)} />
            ))}
          </>
        )}
      </Tooltip>
    </>
  );
}
