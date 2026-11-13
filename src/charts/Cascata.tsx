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

  // largura mínima por barra, para os rótulos não se sobreporem: 56 px, ou mais quando dois rótulos
  // vizinhos longos ("Financiamentos", "Investimentos") não cabem lado a lado (cerca de 6,3 px por letra
  // no tamanho do rótulo, cada um centrado na sua barra). Mais largo que o cartão, o gráfico rola.
  const larguraRotulo = passos.map(
    (p) => Math.max(...quebrarRotulo(p.rotulo).map((parte) => parte.length)) * 6.3,
  );
  const faixaMinima = Math.max(56, ...larguraRotulo.slice(1).map((w, i) => (w + larguraRotulo[i]!) / 2 + 4));
  const W = Math.max(largura, passos.length * faixaMinima + 16);
  const H = altura;
  const P = { l: 8, r: 8, t: 30, b: 46 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  // só geometria: a escala vai do piso (ou do ponto mais baixo, nunca acima de zero) até o mais
  // alto (nunca abaixo de zero). Com barras abaixo de zero (saldo negativo), sobra espaço embaixo
  // para o rótulo, que vai sob a barra.
  const pontas = passos.flatMap((p) => [p.de, p.ate]);
  const topo0 = Math.max(0, ...pontas);
  const fundo0 = grafico.piso ?? Math.min(0, ...pontas);
  const faixa = topo0 - fundo0 || 1;
  const lo = fundo0 < 0 && grafico.piso == null ? fundo0 - faixa * 0.1 : fundo0;
  const hi = topo0 > 0 ? topo0 * 1.04 : topo0 + faixa * 0.04;
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
        {lo < 0 && <line className="ref zero" x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} />}
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
              <text
                className={`wf-val ${p.estilo}`}
                x={cx(i)}
                // barra toda abaixo de zero: o rótulo vai embaixo dela
                y={Math.max(p.de, p.ate) <= 0 && Math.min(p.de, p.ate) < 0 ? base + 16 : topo - 8}
                textAnchor="middle"
              >
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
