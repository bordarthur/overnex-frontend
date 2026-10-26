import type { GraficoCombo } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarEixo, formatarNaDica, useFoco } from './escala';
import { useLargura } from './useLargura';
import './charts.css';

interface Props {
  grafico: GraficoCombo;
  aria: string;
  altura?: number;
}

/** Barras com o traço da referência e uma linha em cima (comboChart do mockup). */
export function Combo(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      {largura > 0 && props.grafico.pontos.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

function Desenho({ grafico, aria, altura = 220, largura }: Props & { largura: number }) {
  const { pontos, nomes, escalaLinha } = grafico;
  const n = pontos.length;
  const { foco, mover, sair } = useFoco(n, 'faixa');
  const rotulo = formatarEixo(grafico);
  const naDica = formatarNaDica(grafico);
  const temLinha = escalaLinha != null && pontos.some((p) => p.linha != null);

  const W = Math.max(240, largura);
  const H = altura;
  const topo = temLinha ? 46 : 18;
  const P = { l: 4, r: 4, t: topo, b: 24 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const todos = [0, ...pontos.flatMap((p) => [p.valor, ...(p.referencia != null ? [p.referencia] : [])])];
  let lo = Math.min(...todos);
  let hi = Math.max(...todos);
  const sp = hi - lo || 1;
  hi += sp * 0.16;
  if (lo < 0) lo -= sp * 0.12;
  const y = (v: number) => P.t + ih - ((v - lo) / (hi - lo)) * ih;
  const slot = iw / n;
  const bw = Math.min(26, slot * 0.62);
  const cx = (i: number) => P.l + slot * i + slot / 2;

  let linha = null;
  if (temLinha && escalaLinha) {
    const fmtLinha = formatarEixo(escalaLinha);
    const vals = pontos.map((p) => p.linha ?? 0);
    const pl = Math.min(...vals);
    const ph = Math.max(...vals);
    // rótulo de cada ponto só se couber; senão um sim, um não, e o último sempre
    const largo = Math.max(...vals.map((v) => fmtLinha(v).length)) * 5.6 + 4;
    const mostrar = (i: number) => slot >= largo || (slot * 2 >= largo && i % 2 === 1) || i === n - 1;
    const py = (v: number) => 8 + (1 - (v - pl) / (ph - pl || 1)) * (topo - 26);
    linha = (
      <g>
        <polyline
          className="cpl"
          points={vals.map((v, i) => `${cx(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')}
        />
        {vals.map((v, i) => (
          <g key={i}>
            <circle className="cpd" cx={cx(i)} cy={py(v)} r={2.4} />
            {mostrar(i) && (
              <text className="cpt" x={cx(i)} y={py(v) - 6} textAnchor="middle">
                {fmtLinha(v)}
              </text>
            )}
          </g>
        ))}
      </g>
    );
  }
  const pontoFoco = foco ? pontos[foco.i] : undefined;

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <line className="ref zero" x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} />
        {pontos.map((p, i) => {
          const ruim = p.status === 'critico';
          const t0 = y(Math.max(0, p.valor));
          const b0 = y(Math.min(0, p.valor));
          const yr = p.referencia != null ? y(p.referencia) : t0;
          return (
            <g key={i}>
              <rect
                className={`cb${ruim ? ' bad' : ''}`}
                x={cx(i) - bw / 2}
                y={t0}
                width={bw}
                height={Math.max(1, b0 - t0)}
                rx={2}
              />
              {p.referencia != null && (
                <line className="co" x1={cx(i) - bw / 2 - 3} x2={cx(i) + bw / 2 + 3} y1={yr} y2={yr} />
              )}
              {(slot > 30 || i % 2 === 1) && (
                <text
                  className={`cv${ruim ? ' bad' : ''}`}
                  x={cx(i)}
                  y={p.valor >= 0 ? Math.min(t0, yr) - 5 : b0 + 12}
                  textAnchor="middle"
                >
                  {rotulo(p.valor)}
                </text>
              )}
              {(slot > 26 || i % 2 === 0) && (
                <text className="ax" x={cx(i)} y={H - 7} textAnchor="middle">
                  {p.rotulo}
                </text>
              )}
            </g>
          );
        })}
        {linha}
        <rect
          className="ov"
          x={P.l}
          y={0}
          width={iw}
          height={H}
          fill="transparent"
          onMouseMove={mover}
          onMouseLeave={sair}
        />
      </svg>
      <Tooltip aberto={pontoFoco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
        {pontoFoco && (
          <>
            <b>{pontoFoco.titulo ?? pontoFoco.rotulo}</b>
            <LinhaDica rotulo={nomes.valor} valor={naDica(pontoFoco.valor)} />
            {pontoFoco.referencia != null && nomes.referencia && (
              <LinhaDica rotulo={nomes.referencia} valor={naDica(pontoFoco.referencia)} />
            )}
            {pontoFoco.linha != null && nomes.linha && escalaLinha && (
              <LinhaDica rotulo={nomes.linha} valor={formatarNaDica(escalaLinha)(pontoFoco.linha)} />
            )}
          </>
        )}
      </Tooltip>
    </>
  );
}
