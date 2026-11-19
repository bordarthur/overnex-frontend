import { Pill } from '../../components/Pill';
import { CONTEUDO } from './conteudo';
import { TituloSecao } from './partes';
import './LinguagemFarol.css';

type Cartao = (typeof CONTEUDO.linguagem.cores)[number]['cartao'];

/** "De onde veio, para onde vai": a série, a linha de referência e a projeção. */
function Tendencia({ cartao }: { cartao: Cartao }) {
  const w = 260;
  const h = 70;
  const todos = [...cartao.serie, cartao.projecao, cartao.linhaReferencia];
  const lo = Math.min(...todos) * 0.97;
  const hi = Math.max(...todos) * 1.03;
  const n = cartao.serie.length;
  const X = (i: number) => 4 + (i * (w - 40)) / n;
  const Y = (v: number) => 6 + (h - 22) - ((v - lo) / (hi - lo)) * (h - 22);
  const ultimo = cartao.serie[n - 1] ?? 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line
        className="s-spk-r"
        x1="4"
        x2={w - 4}
        y1={Y(cartao.linhaReferencia)}
        y2={Y(cartao.linhaReferencia)}
      />
      <polyline className="s-spk-l" points={cartao.serie.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
      <line className="s-spk-p" x1={X(n - 1)} y1={Y(ultimo)} x2={X(n)} y2={Y(cartao.projecao)} />
      <circle className="s-spk-d" cx={X(n)} cy={Y(cartao.projecao)} r="4" />
      <text className="s-spk-t" x="4" y={h - 2}>
        de onde veio
      </text>
      <text className="s-spk-t" x={w - 4} y={h - 2} textAnchor="end">
        para onde vai
      </text>
    </svg>
  );
}

export function LinguagemFarol() {
  const l = CONTEUDO.linguagem;
  return (
    <section id="linguagem" className="s-sec s-sem-topo" aria-labelledby="lf-t">
      <div className="s-wrap">
        <TituloSecao id="lf-t" sobretitulo={l.sobretitulo} titulo={l.titulo} />
        <div className="s-lf-grade">
          {l.cores.map((c) => (
            <div key={c.status} className="s-lf-col s-rv" data-status={c.status}>
              <h3>{c.nome}</h3>
              <p>{c.diz}</p>
              <div className="s-tile">
                <div className="s-tile-h">
                  <span>{c.cartao.nome}</span>
                  <Pill status={c.status} />
                </div>
                <div className="s-tile-v">
                  <b>{c.cartao.valor}</b>
                  <span className={c.status === 'saudavel' ? 's-delta-bom' : 's-delta-ruim'}>
                    {c.cartao.delta}
                  </span>
                </div>
                <div className="s-tile-ref">{c.cartao.referencia}</div>
                <Tendencia cartao={c.cartao} />
              </div>
            </div>
          ))}
        </div>
        <div className="s-lf-diz s-rv">
          <p>{l.frase}</p>
          <p>
            {l.nota[0]}{' '}
            <i className="s-ibtn" role="img" aria-label="informação">
              i
            </i>{' '}
            {l.nota[1]}
          </p>
        </div>
        <p className="s-demo s-rv">{l.demo}</p>
      </div>
    </section>
  );
}
