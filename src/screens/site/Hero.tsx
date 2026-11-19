import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Gauge } from '../../charts/Gauge';
import { Pill } from '../../components/Pill';
import { formatarPct } from '../../format';
import { CONTEUDO } from './conteudo';
import { feixe, VELOCIMETRO_VENDAS } from './farol';
import { BotaoDemo } from './partes';
import './Hero.css';

const W = 600;
const H = 400;

export function Hero() {
  const { hero, farol } = CONTEUDO;
  const k = hero.cartao;
  const f = useMemo(() => feixe(farol.vendas, W, H), [farol.vendas]);
  const linha = useRef<SVGPathElement>(null);

  // O traço se desenha do começo ao fim: o tamanho do caminho vai para o CSS (stroke-dasharray).
  useEffect(() => {
    const p = linha.current;
    if (!p || typeof p.getTotalLength !== 'function') return;
    p.style.setProperty('--len', String(Math.ceil(p.getTotalLength())));
  }, []);

  const ponto: CSSProperties = { left: `${(f.x / W) * 100}%`, top: `${(f.y / H) * 100}%` };

  return (
    <section id="inicio" className="s-hero" aria-labelledby="hero-t">
      <div className="s-wrap s-hero-grade">
        <div className="s-rv">
          <p className="s-sobre">{hero.assinatura}</p>
          <h1 id="hero-t">{hero.titulo}</h1>
          <p className="s-hero-sub">{hero.sub}</p>
          <div className="s-hero-cta">
            <BotaoDemo />
            <a className="s-lnk" href={hero.secundario[1]}>
              {hero.secundario[0]}
            </a>
          </div>
        </div>
        <div
          className="s-hero-palco s-rv"
          role="group"
          aria-label="Exemplo do produto com dados do Cliente Demo"
        >
          <span className="s-hero-tag">overnex.app · Visão geral</span>
          <div className="s-hero-feixe" aria-hidden="true">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <line className="s-grade" x1="0" x2={W} y1={H * 0.25} y2={H * 0.25} strokeDasharray="2 6" />
              <line className="s-grade" x1="0" x2={W} y1={H * 0.55} y2={H * 0.55} strokeDasharray="2 6" />
              <path ref={linha} className="s-degrau s-desenhar" d={f.d} />
            </svg>
            <i className="s-halo" style={ponto} />
            <i className="s-ponto" style={ponto} />
          </div>
          <article className="s-pc">
            <div className="s-pc-h">
              <span>{k.nome}</span>
              <Pill status={k.status} />
            </div>
            <Gauge
              {...VELOCIMETRO_VENDAS}
              unidade="pct"
              ponteiro={k.pct}
              rotuloAria={`${k.nome}: ${formatarPct(k.pct)}, projeção de ${k.projecao} contra meta de ${k.meta}`}
            />
            <div className="s-pc-val">
              <b>{formatarPct(k.pct)}</b>
            </div>
            <p className="s-pc-ref">
              Projeção de fechamento <strong>{k.projecao}</strong> · meta {k.meta}
            </p>
            <p className="s-pc-diz">{k.frase}</p>
            <div className="s-pc-pe">
              <span>{k.rodape[0]}</span>
              <span>{k.rodape[1]}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
