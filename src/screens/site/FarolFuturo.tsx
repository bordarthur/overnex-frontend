import { useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Gauge } from '../../charts/Gauge';
import { Pill } from '../../components/Pill';
import { formatarMoeda, formatarPct } from '../../format';
import { CONTEUDO } from './conteudo';
import { acumular, escadinha, projetar, VELOCIMETRO_VENDAS } from './farol';
import { TituloSecao } from './partes';
import './FarolFuturo.css';

// caixa do gráfico (a do mockup)
const W = 720;
const H = 380;
const ESQ = 8;
const DIR = 150;
const TOPO = 24;
const BASE = 40;
const LARG = W - ESQ - DIR;
const ALT = H - TOPO - BASE;
// teto do eixo, em R$ mil
const TETO = 7600;

/** R$ mil → "R$ 6,54 mi" / "R$ 337 mil" */
const reais = (mil: number) => formatarMoeda(mil * 1000);

/** A frase do cartão, conforme o dia: mês fechado, acima ou abaixo da meta. */
function frase(dia: number, diasUteis: number, meta: number, p: ReturnType<typeof projetar>): ReactNode {
  if (dia === diasUteis)
    return (
      <>
        Mês fechado em <b>{reais(p.vendido)}</b>, <b>{reais(meta - p.vendido)} abaixo</b> da meta. No dia 13,
        o farol já estava amarelo: ainda dava tempo.
      </>
    );
  if (p.projecao >= meta)
    return (
      <>
        No ritmo de hoje, você fecha <b>{reais(p.distancia)} acima</b> da meta. Vendendo{' '}
        <b>{reais(p.faltaPorDia)} por dia útil</b>, você chega lá.
      </>
    );
  return (
    <>
      No ritmo de hoje, você fecha <b>{reais(p.distancia)} abaixo</b> da meta. Faltam{' '}
      <b>{reais(p.faltaPorDia)} por dia útil</b>.
    </>
  );
}

export function FarolFuturo() {
  const f = CONTEUDO.farol;
  const N = f.diasUteis;
  const [dia, setDia] = useState(f.inicio);
  const idControle = useId();
  const idDescricao = useId();
  const acumulado = useMemo(() => acumular(f.vendas), [f.vendas]);
  const p = projetar(acumulado, dia, N, f.meta);

  const x = (d: number) => ESQ + (d / N) * LARG;
  const y = (v: number) => TOPO + ALT - (v / TETO) * ALT;
  const [px, py] = [x(dia), y(p.vendido)];
  const [ex, ey] = [x(N), y(p.projecao)];
  const trilho = { '--p': `${((dia - 1) / (N - 1)) * 100}%` } as CSSProperties;

  return (
    <section id="farol" className="s-sec s-ff s-escuro" aria-labelledby="ff-t">
      <div className="s-wrap">
        <TituloSecao id="ff-t" sobretitulo={f.sobretitulo} titulo={f.titulo} />
        <p className="s-lede s-rv">{f.texto}</p>
        <div className="s-ff-quadro s-rv">
          <div className="s-ff-grafico">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={idDescricao} data-status={p.status}>
              <desc id={idDescricao}>
                Vendas acumuladas por dia útil contra a meta do mês e a projeção de fechamento.
              </desc>
              {[0, 2000, 4000, 6000].map((v) => (
                <g key={v}>
                  <line
                    className="s-ax"
                    x1={ESQ}
                    x2={ESQ + LARG}
                    y1={y(v)}
                    y2={y(v)}
                    strokeDasharray={v ? '2 6' : undefined}
                  />
                  <text className="s-axl" x={ESQ} y={y(v) - 7}>
                    {v ? `R$ ${v / 1000} mi` : ''}
                  </text>
                </g>
              ))}
              {[1, 5, 10, 15, 20, 22].map((d) => (
                <text key={d} className="s-axl" x={x(d - 0.5)} y={H - 12} textAnchor="middle">
                  {d}
                </text>
              ))}
              <line className="s-meta" x1={x(0)} y1={y(0)} x2={x(N)} y2={y(f.meta)} />
              <line className="s-meta s-meta-teto" x1={x(0)} y1={y(f.meta)} x2={x(N)} y2={y(f.meta)} />
              <text className="s-metal" x={ESQ} y={y(f.meta) - 9}>
                Meta · {reais(f.meta)}
              </text>
              <path className="s-real" d={escadinha(acumulado, dia, x, y)} />
              <line
                className="s-proj"
                x1={px.toFixed(1)}
                y1={py.toFixed(1)}
                x2={ex.toFixed(1)}
                y2={ey.toFixed(1)}
              />
              <circle className="s-agora" r="5" cx={px} cy={py} />
              <circle className="s-pdot" r="7" cx={ex} cy={ey} />
              <text className="s-pl" textAnchor="start" x={ex + 12} y={ey + 6}>
                {reais(p.projecao)}
              </text>
            </svg>
            <div className="s-ff-controle">
              <label htmlFor={idControle}>{f.controle}</label>
              <input
                className="s-ff-trilho"
                id={idControle}
                type="range"
                min={1}
                max={N}
                step={1}
                value={dia}
                style={trilho}
                aria-valuetext={`dia útil ${dia} de ${N}`}
                onChange={(e) => setDia(Number(e.target.value))}
              />
              <output htmlFor={idControle}>
                {dia} de {N}
              </output>
            </div>
          </div>
          <div className="s-ff-lado">
            <div className="s-ff-luz" data-status={p.status} aria-live="polite">
              <span className="s-ff-rot">Vendas contra a meta · projeção</span>
              <span className="s-ff-grande">{formatarPct(p.pct)}</span>
              <Pill status={p.status} />
              <Gauge
                {...VELOCIMETRO_VENDAS}
                unidade="pct"
                ponteiro={Math.max(VELOCIMETRO_VENDAS.min, Math.min(VELOCIMETRO_VENDAS.max, p.pct))}
                rotuloAria="Velocímetro de vendas contra a meta"
              />
              <p className="s-ff-diz">{frase(dia, N, f.meta, p)}</p>
            </div>
          </div>
        </div>
        <p className="s-ff-legenda s-rv">{f.legenda}</p>
      </div>
    </section>
  );
}
