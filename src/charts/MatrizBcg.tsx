import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { IconeQuadrante } from '../components/IconeQuadrante';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import type { CartaoBcg, IdQuadranteBcg, PontoBcg } from '../contracts/painel';
import { formatarExibicao } from '../format';
import { formatarEixo } from './escala';
import { ticksRedondos } from './geometria';
import { ALTURA_ROTULO, larguraDoNome, posicionarRotulos, type Caixa } from './rotulosPontos';
import { useLargura } from './useLargura';
import './charts.css';

interface Props {
  cartao: Pick<CartaoBcg, 'eixoX' | 'eixoY' | 'corteX' | 'corteY' | 'quadrantes'>;
  /** o nível desenhado: as famílias ou os produtos da família aberta */
  pontos: PontoBcg[];
  /** clicar numa família abre os produtos dela; sem ele (os produtos), as bolhas não são botões */
  onAbrir?: (ponto: PontoBcg) => void;
  aria: string;
}

/** Matriz BCG: giro contra margem, com os cortes nas medianas e um quadrante em cada canto (mockup M3.1.0). */
export function MatrizBcg(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      {largura > 0 && props.pontos.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

// onde fica cada quadrante: Interrogação em cima à esquerda, Estrela em cima à direita
const CANTOS: Record<IdQuadranteBcg, { direita: boolean; cima: boolean }> = {
  interrogacao: { direita: false, cima: true },
  estrela: { direita: true, cima: true },
  abacaxi: { direita: false, cima: false },
  'vaca-leiteira': { direita: true, cima: false },
};
const ICONE = 18;

interface Foco {
  ponto: PontoBcg;
  x: number;
  y: number;
}

function Desenho({ cartao, pontos, onAbrir, aria, largura }: Props & { largura: number }) {
  const { eixoX, eixoY, corteX, corteY, quadrantes } = cartao;
  const [foco, setFoco] = useState<Foco | null>(null);
  const fx = formatarEixo(eixoX);
  const fy = formatarEixo(eixoY);
  const familias = onAbrir != null;

  const W = Math.max(320, largura);
  const H = W < 560 ? 380 : 440;
  const P = { l: 52, r: 20, t: 18, b: 44 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;

  // a escala inclui os cortes, com folga para as bolhas não encostarem na borda
  const xs = [...pontos.map((p) => p.x), corteX.valor];
  const ys = [...pontos.map((p) => p.y), corteY.valor];
  let x0 = Math.min(...xs);
  let x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  const px = Math.max(0.6, (x1 - x0) * 0.14);
  const py = Math.max(3, (y1 - y0) * 0.18);
  x0 = Math.max(0, x0 - px);
  x1 += px;
  y0 = y0 >= 0 ? Math.max(0, y0 - py) : y0 - py;
  y1 += py;
  const xt = ticksRedondos(x0, x1, 5).filter((t) => t >= x0 && t <= x1);
  const yt = ticksRedondos(y0, y1, 4).filter((t) => t >= y0 && t <= y1);
  const X = (v: number) => P.l + ((v - x0) / (x1 - x0)) * iw;
  const Y = (v: number) => P.t + ih - ((v - y0) / (y1 - y0)) * ih;
  const maior = Math.max(...pontos.map((p) => p.tamanho), 1);
  const R = (t: number) => 6 + (familias ? 19 : 14) * Math.sqrt(Math.max(0, t) / maior);
  const xm = X(corteX.valor);
  const ym = Y(corteY.valor);

  // nome e ícone de cada quadrante no canto dele; os nomes das bolhas não passam por cima
  const cantos = quadrantes.map((q) => {
    const { direita, cima } = CANTOS[q.id];
    const x = direita ? W - P.r - 12 : P.l + 12;
    const y = cima ? P.t + 12 : P.t + ih - 30;
    const w = ICONE + 6 + q.rotulo.length * 7.4;
    const caixa: Caixa = { x: direita ? x - w : x, y, w, h: ICONE };
    return { ...q, x, y, direita, caixa };
  });
  // os rótulos das medianas também (Poppins 10,5px, cerca de 5,9px por letra)
  const larguraMediana = (texto: string) => texto.length * 5.9;
  const medianas: Caixa[] = [
    { x: xm + 5, y: P.t + ih - 6 - 11, w: larguraMediana(corteX.rotulo), h: 13 },
    {
      x: W - P.r - 4 - larguraMediana(corteY.rotulo),
      y: ym - 6 - 11,
      w: larguraMediana(corteY.rotulo),
      h: 13,
    },
  ];
  const bolhas = pontos.map((p) => ({ x: X(p.x), y: Y(p.y), r: R(p.tamanho) }));
  const rotulos = posicionarRotulos(
    pontos
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.rotular)
      .sort((a, b) => b.p.tamanho - a.p.tamanho)
      .map(({ p, i }) => ({ i, largura: larguraDoNome(p.nome) })),
    bolhas,
    { x: P.l, y: P.t, w: iw, h: ih },
    [...cantos.map((c) => c.caixa), ...medianas],
  );

  const mostrar = (ponto: PontoBcg) => (e: MouseEvent<SVGCircleElement>) =>
    setFoco({ ponto, x: e.clientX, y: e.clientY });
  // pelo teclado, a dica fica sobre a bolha em foco
  const focar = (ponto: PontoBcg) => (e: FocusEvent<SVGCircleElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setFoco({ ponto, x: r.left + r.width / 2, y: r.top });
  };
  const teclar = (ponto: PontoBcg) => (e: KeyboardEvent<SVGCircleElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    setFoco(null);
    onAbrir?.(ponto);
  };

  return (
    <>
      <svg className="bcg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={aria}>
        <g aria-hidden="true">
          <rect
            className="qbg q-interrogacao"
            x={P.l}
            y={P.t}
            width={Math.max(0, xm - P.l)}
            height={Math.max(0, ym - P.t)}
          />
          <rect
            className="qbg q-estrela"
            x={xm}
            y={P.t}
            width={Math.max(0, W - P.r - xm)}
            height={Math.max(0, ym - P.t)}
          />
          <rect
            className="qbg q-abacaxi"
            x={P.l}
            y={ym}
            width={Math.max(0, xm - P.l)}
            height={Math.max(0, P.t + ih - ym)}
          />
          <rect
            className="qbg q-vaca-leiteira"
            x={xm}
            y={ym}
            width={Math.max(0, W - P.r - xm)}
            height={Math.max(0, P.t + ih - ym)}
          />
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
          <text className="ax" x={P.l + iw / 2} y={H - 5} textAnchor="middle">
            {eixoX.rotulo} →
          </text>
          <text className="ax" transform={`translate(13 ${P.t + ih / 2}) rotate(-90)`} textAnchor="middle">
            {eixoY.rotulo} →
          </text>
          <line className="med" x1={xm} x2={xm} y1={P.t} y2={P.t + ih} />
          <line className="med" x1={P.l} x2={W - P.r} y1={ym} y2={ym} />
          <text className="medl" x={xm + 5} y={P.t + ih - 6}>
            {corteX.rotulo}
          </text>
          <text className="medl" x={W - P.r - 4} y={ym - 6} textAnchor="end">
            {corteY.rotulo}
          </text>
          {cantos.map((c) => (
            <g key={c.id} className={`qcanto q-${c.id}`}>
              <IconeQuadrante quadrante={c.id} tamanho={ICONE} x={c.direita ? c.x - ICONE : c.x} y={c.y} />
              <text
                className="qn"
                x={c.direita ? c.x - ICONE - 6 : c.x + ICONE + 6}
                y={c.y + 14}
                textAnchor={c.direita ? 'end' : 'start'}
              >
                {c.rotulo}
              </text>
            </g>
          ))}
        </g>
        {/* as maiores embaixo, para as pequenas ficarem clicáveis */}
        {pontos
          .map((p, i) => ({ p, b: bolhas[i]! }))
          .sort((a, b) => b.p.tamanho - a.p.tamanho)
          .map(({ p, b }) => (
            <circle
              key={p.id}
              className={`bub q-${p.quadrante}${p.apagado ? ' dim' : ''}${familias ? ' abre' : ''}`}
              cx={b.x}
              cy={b.y}
              r={b.r}
              {...(familias
                ? {
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': `${p.nome}: abrir os produtos`,
                    onClick: () => {
                      setFoco(null);
                      onAbrir(p);
                    },
                    onKeyDown: teclar(p),
                    onFocus: focar(p),
                    onBlur: () => setFoco(null),
                  }
                : { 'aria-hidden': true })}
              onMouseMove={mostrar(p)}
              onMouseLeave={() => setFoco(null)}
            />
          ))}
        <g aria-hidden="true">
          {rotulos.map(({ i, caixa, linha }) => {
            const p = pontos[i];
            if (!p) return null;
            return (
              <g key={p.id} className={p.apagado ? 'dim' : undefined}>
                {linha && <line className="ptlead" x1={linha[0]} y1={linha[1]} x2={linha[2]} y2={linha[3]} />}
                <text className="blab" x={caixa.x} y={caixa.y + ALTURA_ROTULO - 3}>
                  {p.nome}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <Tooltip aberto={foco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
        {foco && (
          <>
            <b>{foco.ponto.nome}</b>
            {foco.ponto.dica.map((d) => (
              <LinhaDica key={d.rotulo} rotulo={d.rotulo} valor={formatarExibicao(d.valor)} />
            ))}
          </>
        )}
      </Tooltip>
    </>
  );
}
