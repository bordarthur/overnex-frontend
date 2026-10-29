import { useId, type CSSProperties } from 'react';
import type { CartaoPagarLancado as Dados } from '../contracts/visaoGeral';
import { formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { CabecalhoCartao } from './CabecalhoCartao';
import { MarcaDagua } from './MarcaDagua';
import './CartaoProximosDias.css';
import './CartaoPagarLancado.css';

/**
 * O que a empresa pagou em cada mês (barras cinza) e, à direita, o que já está lançado para os
 * próximos dias, com o que falta para chegar à média paga empilhado em cima (hachurado).
 */
export function CartaoPagarLancado({ cartao }: { cartao: Dados }) {
  const idTitulo = useId();
  const { pagos, media, proximos } = cartao;
  const futuro = proximos.lancado.valor.valor + proximos.falta.valor.valor;
  // folga no topo para o rótulo da média e o do valor
  const teto = Math.max(media.valor.valor, futuro, ...pagos.map((p) => p.valor.valor)) * 1.17 || 1;
  const altura = (v: number) => `${(v / teto) * 100}%`;
  const aria =
    `${pagos.map((p) => `${p.rotulo}: ${formatarValor(p.valor)}`).join(', ')}; ` +
    `${proximos.rotulo}: ${proximos.lancado.rotulo} ${formatarValor(proximos.lancado.valor)}, ` +
    `${proximos.falta.rotulo} ${formatarValor(proximos.falta.valor)}`;

  return (
    <article className="card fin" aria-labelledby={idTitulo}>
      <CabecalhoCartao
        idTitulo={idTitulo}
        titulo={cartao.titulo}
        subtitulo={cartao.subtitulo}
        status={cartao.status}
        explicacao={cartao.explicacao}
      />
      <div className="fx-lead">
        <b className={`fx-big t-${STATUS[cartao.status].classe}`}>{formatarValor(cartao.percentual)}</b>
        <p>{cartao.texto}</p>
        <span className="r-sub">{cartao.nota}</span>
      </div>
      <div className="lc" role="img" aria-label={aria} style={{ '--lc-n': pagos.length } as CSSProperties}>
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
              <span className="lc-lanc" style={{ flex: proximos.lancado.valor.valor }}>
                <em>
                  {proximos.lancado.rotulo}
                  <br />
                  {formatarValor(proximos.lancado.valor)}
                </em>
              </span>
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
      <MarcaDagua variante="cartao" />
    </article>
  );
}
