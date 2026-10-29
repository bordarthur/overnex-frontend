import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Linha } from '../charts/Linha';
import { useLargura } from '../charts/useLargura';
import type { CartaoInadimplencia as Dados, Status } from '../contracts/visaoGeral';
import { formatarPct, formatarRotulo, formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { CabecalhoCartao } from './CabecalhoCartao';
import { MarcaDagua } from './MarcaDagua';
import { LinhaDica } from './Tooltip';
import { Trechos } from './Trechos';
import './CartaoInadimplencia.css';

/**
 * Classe de cor de cada faixa da carteira. As faixas críticas ganham tons crescentes (c1 a c3) na
 * ordem em que vêm, como no mockup: é só desenho, o status continua o que a API mandou.
 */
function tons(carteira: { status: Status }[]): string[] {
  const criticas = carteira.filter((x) => x.status === 'critico').length;
  let k = 0;
  return carteira.map((x) => {
    if (x.status !== 'critico') return STATUS[x.status].classe;
    const tom = criticas === 1 ? 3 : Math.round(1 + (2 * k) / (criticas - 1));
    k += 1;
    return `c${tom}`;
  });
}

/** Fitas que ligam cada pedaço da barra ao quadro da faixa, medidas na tela. */
function useFitas(largura: number, chave: unknown) {
  const meio = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLDivElement>(null);
  const quadros = useRef<HTMLDivElement>(null);
  const [fitas, setFitas] = useState<{ topo: number; altura: number; d: string[] } | null>(null);

  useLayoutEffect(() => {
    const m = meio.current?.getBoundingClientRect();
    const b = barra.current?.getBoundingClientRect();
    const q = quadros.current?.getBoundingClientRect();
    if (!m || !b || !q || !barra.current || !quadros.current) return;
    const altura = q.top - b.bottom;
    if (altura <= 0 || m.width === 0) return setFitas(null);
    const pedacos = [...barra.current.children].map((e) => e.getBoundingClientRect());
    const alvos = [...quadros.current.children].map((e) => e.getBoundingClientRect());
    const d = pedacos.map((a, i) => {
      const t = alvos[i];
      if (!t) return '';
      const [al, ar, tl, trr] = [a.left, a.right, t.left, t.right].map((v) => (v - m.left).toFixed(1));
      return `M${al},0 L${ar},0 L${trr},${altura} L${tl},${altura} Z`;
    });
    setFitas({ topo: b.bottom - m.top, altura, d });
  }, [largura, chave]);

  return { meio, barra, quadros, fitas };
}

// Os textos fixos aqui descrevem o tipo de cartão ('inadimplencia'), não uma seção ou indicador do cliente.
export function CartaoInadimplencia({ cartao }: { cartao: Dados }) {
  const idTitulo = useId();
  const { serie, carteira } = cartao;
  const unidade = cartao.percentual.unidade;
  const ultimo = serie.valores.length - 1;
  const classes = tons(carteira);
  const [refCartao, largura] = useLargura<HTMLElement>();
  const { meio, barra, quadros, fitas } = useFitas(largura, carteira);

  return (
    <article className="card inad" aria-labelledby={idTitulo} ref={refCartao}>
      <CabecalhoCartao
        idTitulo={idTitulo}
        titulo={cartao.titulo ?? 'Inadimplência'}
        subtitulo={cartao.subtitulo ?? 'Quanto da carteira a receber já venceu e há quanto tempo'}
        status={cartao.status}
        explicacao={cartao.explicacao}
      />
      <div className="ic2">
        <div className="inad-big">
          <b className={`inad-num t-${STATUS[cartao.status].classe}`}>{formatarValor(cartao.percentual)}</b>
          <p>
            <Trechos trechos={cartao.texto} />
          </p>
          <span className="r-sub">{cartao.nota}</span>
        </div>
        <div className="ic2-mid" ref={meio}>
          <div
            className="inad-bar"
            ref={barra}
            role="img"
            aria-label="Carteira a receber por faixa de atraso"
          >
            {carteira.map((x, i) => (
              <span
                key={x.rotulo}
                className={`ib-${classes[i]}`}
                style={{ width: `${Math.max(x.percentual, 3.2)}%` }}
                title={`${x.rotulo}: ${formatarValor(x.valor)}`}
              />
            ))}
          </div>
          {fitas && (
            <svg
              className="ic2-rib"
              aria-hidden="true"
              width="100%"
              height={fitas.altura}
              style={{ top: fitas.topo }}
            >
              {fitas.d.map((d, i) => (
                <path key={carteira[i]?.rotulo ?? i} className={`rb rb-${classes[i]}`} d={d} />
              ))}
            </svg>
          )}
          <div className="ic2-tiles" ref={quadros}>
            {carteira.map((x, i) => (
              <div key={x.rotulo} className={`at2 ${classes[i]}`}>
                <span>{x.rotulo}</span>
                <b>{formatarValor(x.valor)}</b>
                <em>{formatarPct(x.percentual)} da carteira</em>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Linha
            rotulos={serie.rotulos}
            valores={serie.valores}
            altura={230}
            // rótulos com o ano ("out-26"): mais espaço entre eles no eixo
            xGap={56}
            padL={32}
            padR={40}
            piso={0}
            referencia={{ valor: serie.media, rotulo: `média ${formatarRotulo(serie.media, unidade, 1)}` }}
            marcadores={
              ultimo >= 0
                ? [{ i: ultimo, rotulo: formatarRotulo(serie.valores[ultimo] ?? 0, unidade, 1) }]
                : []
            }
            formatarEixo={(v) => formatarRotulo(v, unidade, 0)}
            aria="Inadimplência em 12 meses"
            animar
            dica={(i) => (
              <>
                <b>{serie.rotulos[i]}</b>
                <LinhaDica
                  rotulo="Vencido sobre a carteira"
                  valor={formatarRotulo(serie.valores[i] ?? 0, unidade, 1)}
                />
              </>
            )}
          />
          <p className="note inad-nota">Vencido sobre a carteira, 12 meses</p>
        </div>
      </div>
      <MarcaDagua variante="cartao" />
    </article>
  );
}
