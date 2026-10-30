import type { GraficoEmpilhado } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarEixo, formatarNaDica, useFoco } from './escala';
import { ticksRedondos } from './geometria';
import { useLargura } from './useLargura';
import './charts.css';

// Paleta categórica do mockup (--c0 a --c6), na ordem das séries; a de atraso tem 5 tons.
const CORES = { series: 7, atraso: 5 } as const;

/** Classe de cor da série j: sc0…sc6 ou sa0…sa4. */
const corDaSerie = (grafico: GraficoEmpilhado, j: number) => {
  const paleta = grafico.paleta ?? 'series';
  return `${paleta === 'atraso' ? 'a' : 'c'}${j % CORES[paleta]}`;
};

interface Props {
  grafico: GraficoEmpilhado;
  aria: string;
  altura?: number;
}

/** Barras empilhadas com a legenda das séries (stackChart do mockup). */
export function Empilhado(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <>
      <div className="legend legend-grafico">
        {props.grafico.series.map((s, j) => (
          <span key={s.nome}>
            <i className={`sq ${corDaSerie(props.grafico, j)}`} aria-hidden="true" />
            {s.nome}
          </span>
        ))}
      </div>
      <div className="chart" ref={ref}>
        {largura > 0 && props.grafico.rotulos.length > 0 && <Desenho {...props} largura={largura} />}
      </div>
    </>
  );
}

function Desenho({ grafico, aria, altura = 240, largura }: Props & { largura: number }) {
  const { rotulos, series, totais } = grafico;
  const n = rotulos.length;
  const { foco, mover, sair } = useFoco(n, 'faixa');
  const eixo = formatarEixo(grafico);
  const naDica = formatarNaDica(grafico);

  const W = Math.max(280, largura);
  const H = altura;
  const P = { l: 40, r: 12, t: totais ? 22 : 14, b: 28 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  // altura de cada pilha: só geometria (a soma das partes que vieram da API)
  const pilhas = rotulos.map((_, i) => series.reduce((a, s) => a + (s.valores[i] ?? 0), 0));
  const hi0 = Math.max(...pilhas, 0) * 1.08 || 1;
  const ticks = ticksRedondos(0, hi0, 4);
  const hi = Math.max(hi0, ticks[ticks.length - 1] ?? hi0);
  const y = (v: number) => P.t + ih - (v / hi) * ih;
  const slot = iw / n;
  const bw = Math.min(34, slot * 0.62);
  const totalFoco = foco ? totais?.[foco.i] : undefined;

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
        {rotulos.map((r, i) => {
          const x0 = P.l + slot * i + (slot - bw) / 2;
          let acc = 0;
          return (
            <g key={i}>
              {series.map((s, j) => {
                const v = s.valores[i] ?? 0;
                const topo = y(acc + v);
                const base = y(acc);
                acc += v;
                return (
                  <g key={s.nome}>
                    <rect
                      className={`s${corDaSerie(grafico, j)}`}
                      x={x0}
                      y={topo}
                      width={bw}
                      height={Math.max(0, base - topo - 1)}
                    />
                    {/* o número só entra quando a parte tem altura para ele */}
                    {grafico.rotulosNasBarras && base - topo > 14 && (
                      <text
                        className={`stl ${corDaSerie(grafico, j)}`}
                        x={x0 + bw / 2}
                        y={(topo + base) / 2 + 4}
                        textAnchor="middle"
                      >
                        {eixo(v)}
                      </text>
                    )}
                  </g>
                );
              })}
              {totais?.[i] != null && (
                <text className="ax tot" x={x0 + bw / 2} y={y(acc) - 5} textAnchor="middle">
                  {eixo(totais[i])}
                </text>
              )}
              <text className="ax" x={x0 + bw / 2} y={H - 8} textAnchor="middle">
                {r}
              </text>
            </g>
          );
        })}
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
            <b>{rotulos[foco.i]}</b>
            {series.map((s) => (
              <LinhaDica key={s.nome} rotulo={s.nome} valor={naDica(s.valores[foco.i] ?? 0)} />
            ))}
            {totalFoco != null && <LinhaDica rotulo="Total" valor={naDica(totalFoco)} />}
          </>
        )}
      </Tooltip>
    </>
  );
}
