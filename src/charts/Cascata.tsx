import type { GraficoCascata } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarValor, MENOS } from '../format';
import { formatarEixo, useFoco } from './escala';
import { quebrarRotulo } from './geometria';
import { useLargura } from './useLargura';
import './charts.css';

interface Props {
  grafico: GraficoCascata;
  aria: string;
  altura?: number;
}

/** Cascata (waterfall do mockup): barras que sobem e descem entre os totais. */
export function Cascata(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    // no celular a cascata fica mais larga que o cartão e rola, em vez de encavalar os rótulos
    <div className="chart chart-rolavel" ref={ref}>
      {largura > 0 && props.grafico.passos.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

function Desenho({ grafico, aria, altura = 290, largura }: Props & { largura: number }) {
  const { passos } = grafico;
  const n = passos.length;
  const { foco, mover, sair } = useFoco(n, 'faixa');
  const eixo = formatarEixo(grafico);

  // largura mínima por barra, para os rótulos não se sobreporem
  const W = Math.max(largura, passos.length * 56 + 16);
  const H = altura;
  const P = { l: 8, r: 8, t: 30, b: 46 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  // só geometria: a escala vai do piso (ou de zero) até o ponto mais alto das barras
  const lo = grafico.piso ?? Math.min(0, ...passos.flatMap((p) => [p.de, p.ate]));
  const hi = Math.max(...passos.flatMap((p) => [p.de, p.ate])) * 1.04;
  const y = (v: number) => P.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const slot = iw / n;
  const bw = Math.min(64, slot * 0.58);
  const cx = (i: number) => P.l + slot * i + slot / 2;
  // passos que não são total levam sinal: "+45 mil", "−4,6 mi"
  const rotulo = (p: GraficoCascata['passos'][number]) =>
    p.estilo === 'total' ? eixo(p.valor) : (p.valor > 0 ? '+' : MENOS) + eixo(Math.abs(p.valor));
  const passoFoco = foco ? passos[foco.i] : undefined;

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        {passos.map((p, i) => {
          const topo = y(Math.max(p.de, p.ate));
          const base = y(Math.min(p.de, p.ate));
          const proximo = passos[i + 1];
          const [l1, l2] = quebrarRotulo(p.rotulo);
          return (
            <g key={i}>
              {proximo && (
                <line
                  className="wf-link"
                  x1={cx(i) + bw / 2}
                  x2={cx(i + 1) - bw / 2}
                  y1={y(p.ate)}
                  y2={y(p.ate)}
                />
              )}
              <rect
                className={`wf-bar ${p.estilo}`}
                x={cx(i) - bw / 2}
                y={topo}
                width={bw}
                height={Math.max(2, base - topo)}
                rx={3}
              />
              <text className={`wf-val ${p.estilo}`} x={cx(i)} y={topo - 8} textAnchor="middle">
                {rotulo(p)}
              </text>
              <text className="wf-lab" x={cx(i)} y={H - 26} textAnchor="middle">
                {l1}
              </text>
              {l2 && (
                <text className="wf-lab" x={cx(i)} y={H - 11} textAnchor="middle">
                  {l2}
                </text>
              )}
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
      <Tooltip aberto={passoFoco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
        {passoFoco && (
          <>
            <b>{passoFoco.rotulo}</b>
            <LinhaDica
              rotulo={passoFoco.estilo === 'total' ? 'Total' : 'Efeito'}
              valor={formatarValor(
                {
                  valor: passoFoco.valor,
                  unidade: grafico.unidade,
                  casas: grafico.casas,
                  sufixo: grafico.sufixo,
                },
                { comSinal: passoFoco.estilo !== 'total' },
              )}
            />
          </>
        )}
      </Tooltip>
    </>
  );
}
