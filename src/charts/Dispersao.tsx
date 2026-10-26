import { useState, type MouseEvent } from 'react';
import type { GraficoDispersao } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarExibicao } from '../format';
import { STATUS } from '../theme/status';
import { formatarEixo, type Foco } from './escala';
import { ticksRedondos } from './geometria';
import { useLargura } from './useLargura';
import './charts.css';

interface Props {
  grafico: GraficoDispersao;
  aria: string;
  altura?: number;
}

/** Bolhas em dois eixos, com linhas de corte e o nome de cada quadrante (scatterChart do mockup). */
export function Dispersao(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      {largura > 0 && props.grafico.pontos.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

function Desenho({ grafico, aria, altura = 360, largura }: Props & { largura: number }) {
  const { pontos, eixoX, eixoY, corteX, corteY, quadrantes = [] } = grafico;
  const [foco, setFoco] = useState<Foco | null>(null);
  const fx = formatarEixo(eixoX);
  const fy = formatarEixo(eixoY);

  const W = Math.max(300, largura);
  const H = altura;
  const P = { l: eixoY.unidade === 'brl' ? 78 : 58, r: 18, t: 16, b: 42 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  let x0 = Math.min(...xs);
  let x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  const px = (x1 - x0 || 1) * 0.08;
  const py = (y1 - y0 || 1) * 0.16;
  x0 -= px;
  x1 += px;
  y0 -= py;
  y1 += py;
  const xt = ticksRedondos(x0, x1, 5);
  const yt = ticksRedondos(y0, y1, 4);
  x0 = Math.min(x0, xt[0] ?? x0);
  x1 = Math.max(x1, xt[xt.length - 1] ?? x1);
  y0 = Math.min(y0, yt[0] ?? y0);
  y1 = Math.max(y1, yt[yt.length - 1] ?? y1);
  const X = (v: number) => P.l + ((v - x0) / (x1 - x0)) * iw;
  const Y = (v: number) => P.t + ih - ((v - y0) / (y1 - y0)) * ih;
  const maior = Math.max(...pontos.map((p) => p.tamanho), 1);
  const R = (t: number) => 4 + 13 * Math.sqrt(Math.max(0, t) / maior);

  const mover = (e: MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left + P.l;
    const my = e.clientY - r.top + P.t;
    let melhor = -1;
    let dist = Infinity;
    pontos.forEach((p, i) => {
      const d = (X(p.x) - mx) ** 2 + (Y(p.y) - my) ** 2;
      if (d < dist) {
        dist = d;
        melhor = i;
      }
    });
    setFoco(melhor >= 0 && dist < 700 ? { i: melhor, x: e.clientX, y: e.clientY } : null);
  };
  const pontoFoco = foco ? pontos[foco.i] : undefined;

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        {yt.map((t) => (
          <g key={`y${t}`}>
            <line className="gl" x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} />
            <text className="ax" x={P.l - 8} y={Y(t) + 4} textAnchor="end">
              {fy(t)}
            </text>
          </g>
        ))}
        {xt.map((t) => (
          <text key={`x${t}`} className="ax" x={X(t)} y={H - 24} textAnchor="middle">
            {fx(t)}
          </text>
        ))}
        <text className="ax" x={P.l + iw / 2} y={H - 6} textAnchor="middle">
          {eixoX.rotulo}
        </text>
        <text className="ax" transform={`translate(12 ${P.t + ih / 2}) rotate(-90)`} textAnchor="middle">
          {eixoY.rotulo}
        </text>
        {corteX != null && <line className="ref" x1={X(corteX)} x2={X(corteX)} y1={P.t} y2={P.t + ih} />}
        {corteY != null && <line className="ref" x1={P.l} x2={W - P.r} y1={Y(corteY)} y2={Y(corteY)} />}
        {quadrantes.map((q) => {
          const direita = q.posicao.endsWith('direito');
          const cima = q.posicao.startsWith('superior');
          return (
            <text
              key={q.posicao}
              className="qlab"
              x={direita ? W - P.r - 8 : P.l + 8}
              y={cima ? P.t + 16 : P.t + ih - 8}
              textAnchor={direita ? 'end' : 'start'}
            >
              {q.rotulo}
            </text>
          );
        })}
        {[...pontos]
          .sort((a, b) => b.tamanho - a.tamanho)
          .map((p) => (
            <circle
              key={p.nome}
              className={`pt ${p.status ? STATUS[p.status].classe : ''}`}
              cx={X(p.x)}
              cy={Y(p.y)}
              r={R(p.tamanho)}
            />
          ))}
        {pontos
          .filter((p) => p.rotular)
          .map((p) => (
            <text key={p.nome} className="ptlab" x={X(p.x) + R(p.tamanho) + 4} y={Y(p.y) + 4}>
              {p.nome}
            </text>
          ))}
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
      <Tooltip aberto={pontoFoco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
        {pontoFoco && (
          <>
            <b>{pontoFoco.nome}</b>
            {pontoFoco.dica.map((d) => (
              <LinhaDica key={d.rotulo} rotulo={d.rotulo} valor={formatarExibicao(d.valor)} />
            ))}
          </>
        )}
      </Tooltip>
    </>
  );
}
