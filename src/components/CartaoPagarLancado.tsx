import { useId, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { useLargura } from '../charts/useLargura';
import type { CartaoPagarLancado as Dados, GrupoPagar } from '../contracts/visaoGeral';
import { formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { CabecalhoCartao } from './CabecalhoCartao';
import { MarcaDagua } from './MarcaDagua';
import './CartaoProximosDias.css';
import './CartaoPagarLancado.css';

/**
 * Um grupo de pagamento: o que a empresa pagou em cada mês (barras cinza) e, à direita, o que já está
 * lançado para os próximos dias, com o que falta para chegar à média do grupo empilhado em cima.
 */
function Grupo({ grupo, largura }: { grupo: GrupoPagar; largura: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { pagos, media, proximos } = grupo;
  const futuro = proximos.lancado.valor.valor + proximos.falta.valor.valor;
  // folga no topo para o rótulo da média e o do valor
  const teto = Math.max(media.valor.valor, futuro, ...pagos.map((p) => p.valor.valor)) * 1.17 || 1;
  const altura = (v: number) => `${(v / teto) * 100}%`;
  const classe = grupo.status ? STATUS[grupo.status].classe : 'neu';
  const aria =
    `${grupo.nome}: ${formatarValor(grupo.percentual)} ${grupo.texto}; ` +
    `${pagos.map((p) => `${p.rotulo}: ${formatarValor(p.valor)}`).join(', ')}; ` +
    `${proximos.rotulo}: ${proximos.lancado.rotulo} ${formatarValor(proximos.lancado.valor)}, ` +
    `${proximos.falta.rotulo} ${formatarValor(proximos.falta.valor)}; ${media.rotulo}`;

  // o texto dentro da barra da direita só aparece quando cabe no pedaço dele
  useLayoutEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('.lc-b.fut em').forEach((em) => {
      const pedaco = em.parentElement;
      const cabe =
        pedaco && em.offsetHeight + 2 <= pedaco.clientHeight && em.offsetWidth + 2 <= pedaco.clientWidth;
      em.style.visibility = pedaco && !cabe ? 'hidden' : '';
    });
  }, [largura, grupo]);

  return (
    <div className="lg" role="img" aria-label={aria} ref={ref}>
      <p className="lg-n">{grupo.nome}</p>
      <div className="lg-v">
        <b className={`s-${classe}`}>{formatarValor(grupo.percentual)}</b>
        <span>{grupo.texto}</span>
      </div>
      <div className="lc" style={{ '--lc-n': pagos.length } as CSSProperties}>
        <div className="lc-plot">
          {pagos.map((p) => (
            <div key={p.rotulo} className="lc-col">
              <span
                className="lc-b"
                style={{ height: altura(p.valor.valor) }}
                title={`${p.rotulo}: ${formatarValor(p.valor)}`}
              />
            </div>
          ))}
          <div className="lc-col wide">
            <span className="lc-b fut" style={{ height: altura(futuro) }}>
              {proximos.falta.valor.valor > 0 && (
                <span className="lc-falta" style={{ flex: proximos.falta.valor.valor }}>
                  <em>
                    {proximos.falta.rotulo}
                    <br />
                    {formatarValor(proximos.falta.valor)}
                  </em>
                </span>
              )}
              {proximos.lancado.valor.valor > 0 && (
                <span className="lc-lanc" style={{ flex: proximos.lancado.valor.valor }}>
                  <em>
                    {proximos.lancado.rotulo}
                    <br />
                    {formatarValor(proximos.lancado.valor)}
                  </em>
                </span>
              )}
            </span>
          </div>
          <i className="lc-avg" style={{ bottom: altura(media.valor.valor) }} />
          <span className="lc-avgl" style={{ bottom: altura(media.valor.valor) }}>
            {media.rotulo}
          </span>
        </div>
        <div className="lc-x">
          {pagos.map((p) => (
            <span key={p.rotulo} className="lc-col">
              {p.rotulo}
            </span>
          ))}
          <span className="lc-col wide">{proximos.rotulo}</span>
        </div>
      </div>
      {grupo.nota && <p className="lg-note">{grupo.nota}</p>}
    </div>
  );
}

/** Quanto do que a empresa paga por mês já está lançado para os próximos dias, no total e por grupo. */
export function CartaoPagarLancado({ cartao }: { cartao: Dados }) {
  const idTitulo = useId();
  const [refCartao, largura] = useLargura<HTMLElement>();

  return (
    <article className="card fin" aria-labelledby={idTitulo} ref={refCartao}>
      <CabecalhoCartao
        idTitulo={idTitulo}
        titulo={cartao.titulo}
        subtitulo={cartao.subtitulo}
        status={cartao.status}
        explicacao={cartao.explicacao}
      />
      <div className="lc3">
        <div className="fx-lead">
          <b className={`fx-big t-${STATUS[cartao.status].classe}`}>{formatarValor(cartao.percentual)}</b>
          <p>{cartao.texto}</p>
          <span className="r-sub">{cartao.nota}</span>
        </div>
        {cartao.grupos.length > 0 && (
          <div
            // com um grupo só, o nome e o número dele repetem o topo do cartão
            className={`lg3${cartao.grupos.length === 1 ? ' unico' : ''}`}
            style={{ '--lg-n': Math.min(cartao.grupos.length, 4) } as CSSProperties}
          >
            <p className="lg-cap">{cartao.rotuloGrupos}</p>
            {cartao.grupos.map((g) => (
              <Grupo key={g.nome} grupo={g} largura={largura} />
            ))}
          </div>
        )}
      </div>
      <MarcaDagua variante="cartao" />
    </article>
  );
}
