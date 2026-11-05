import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { useLargura } from '../charts/useLargura';
import type { Status, Valor } from '../contracts/visaoGeral';
import { formatarPct, formatarValor } from '../format';
import { STATUS } from '../theme/status';
import './BarraIdade.css';

export interface FaixaIdade {
  rotulo: string;
  valor: Valor;
  // em % do total, pronto da API
  percentual: number;
  status?: Status;
  // a faixa fica só na barra, com o rótulo dentro, sem quadro embaixo (o a vencer)
  soNaBarra?: boolean | null;
}

interface Props {
  faixas: FaixaIdade[];
  // depois do percentual ("da carteira"); sem ele, só o número
  sufixo?: string | null;
  aria: string;
}

/**
 * Classe de cor de cada faixa. As faixas críticas ganham tons crescentes (c1 a c3) na ordem em que
 * vêm, como no mockup: é só desenho, o status continua o que a API mandou.
 */
function tons(faixas: FaixaIdade[]): string[] {
  const criticas = faixas.filter((x) => x.status === 'critico').length;
  let k = 0;
  return faixas.map((x) => {
    if (!x.status) return 'neu';
    if (x.status !== 'critico') return STATUS[x.status].classe;
    const tom = criticas === 1 ? 3 : Math.round(1 + (2 * k) / (criticas - 1));
    k += 1;
    return `c${tom}`;
  });
}

/**
 * Fitas que ligam cada pedaço da barra ao seu quadro, medidas na tela. Pedaço e quadro se acham pelo
 * `data-i` (o índice da faixa): a faixa zerada tem quadro, mas não tem pedaço nem fita.
 */
function useFitas(meio: RefObject<HTMLDivElement | null>, largura: number, ligadas: number[]) {
  const barra = useRef<HTMLDivElement>(null);
  const quadros = useRef<HTMLDivElement>(null);
  const [fitas, setFitas] = useState<{ topo: number; altura: number; d: { i: number; d: string }[] } | null>(
    null,
  );

  useLayoutEffect(() => {
    const m = meio.current?.getBoundingClientRect();
    const b = barra.current?.getBoundingClientRect();
    const q = quadros.current?.getBoundingClientRect();
    if (!m || !b || !q || !barra.current || !quadros.current) return;
    const altura = q.top - b.bottom;
    if (altura <= 0 || m.width === 0) return setFitas(null);
    const d = ligadas.flatMap((i) => {
      const a = barra.current?.querySelector(`[data-i="${i}"]`)?.getBoundingClientRect();
      const t = quadros.current?.querySelector(`[data-i="${i}"]`)?.getBoundingClientRect();
      if (!a || !t) return [];
      const [al, ar, tl, trr] = [a.left, a.right, t.left, t.right].map((v) => (v - m.left).toFixed(1));
      return [{ i, d: `M${al},0 L${ar},0 L${trr},${altura} L${tl},${altura} Z` }];
    });
    setFitas({ topo: b.bottom - m.top, altura, d });
  }, [meio, largura, ligadas]);

  return { barra, quadros, fitas };
}

/**
 * Barra das faixas de idade (a vencer, 1 a 30 dias…) e, embaixo, um quadro por faixa, ligado ao seu
 * pedaço da barra por uma fita. Usada na inadimplência da Visão geral e no Receber e pagar.
 */
export function BarraIdade({ faixas, sufixo, aria }: Props) {
  const classes = tons(faixas);
  const comPct = (x: FaixaIdade) => `${formatarPct(x.percentual)}${sufixo ? ` ${sufixo}` : ''}`;
  const comQuadro = useMemo(() => faixas.flatMap((x, i) => (x.soNaBarra ? [] : [i])), [faixas]);
  // faixa zerada não entra na barra: o quadro fica, apagado e sem fita
  const ligadas = useMemo(
    () => comQuadro.filter((i) => (faixas[i]?.valor.valor ?? 0) > 0),
    [comQuadro, faixas],
  );
  const [meio, largura] = useLargura<HTMLDivElement>();
  const { barra, quadros, fitas } = useFitas(meio, largura, ligadas);

  // o texto dentro da barra só aparece inteiro; numa faixa estreita, fica só na dica
  useLayoutEffect(() => {
    barra.current?.querySelectorAll<HTMLElement>('em').forEach((em) => {
      const faixa = em.parentElement;
      em.style.visibility = faixa && em.offsetWidth > faixa.clientWidth ? 'hidden' : '';
    });
  }, [barra, largura, faixas]);

  return (
    <div className="barra-idade" ref={meio}>
      <div className="inad-bar" ref={barra} role="img" aria-label={aria}>
        {faixas.map(
          (x, i) =>
            x.valor.valor > 0 && (
              <span
                key={x.rotulo}
                data-i={i}
                className={`ib-${classes[i]}`}
                style={{ width: `${Math.max(x.percentual, 3.2)}%` }}
                title={`${x.rotulo}: ${formatarValor(x.valor)}`}
              >
                {x.soNaBarra && (
                  <em>
                    {x.rotulo}: {formatarValor(x.valor)}, {comPct(x)}
                  </em>
                )}
              </span>
            ),
        )}
      </div>
      {fitas && (
        <svg
          className="ic2-rib"
          aria-hidden="true"
          width="100%"
          height={fitas.altura}
          style={{ top: fitas.topo }}
        >
          {fitas.d.map(({ i, d }) => (
            <path key={faixas[i]?.rotulo ?? i} className={`rb rb-${classes[i]}`} d={d} />
          ))}
        </svg>
      )}
      <div className="ic2-tiles" ref={quadros} style={{ '--n-quadros': comQuadro.length } as CSSProperties}>
        {comQuadro.map((i) => {
          const x = faixas[i];
          if (!x) return null;
          return (
            <div key={x.rotulo} data-i={i} className={`at2 ${x.valor.valor > 0 ? classes[i] : 'zero'}`}>
              <span>{x.rotulo}</span>
              <b>{formatarValor(x.valor)}</b>
              <em>{comPct(x)}</em>
            </div>
          );
        })}
      </div>
    </div>
  );
}
