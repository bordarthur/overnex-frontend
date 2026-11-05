import { useId, type CSSProperties } from 'react';
import type { CartaoCobertura as Dados } from '../contracts/visaoGeral';
import { formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { CabecalhoCartao } from './CabecalhoCartao';
import { MarcaDagua } from './MarcaDagua';
import { Trechos } from './Trechos';
import './CartaoProximosDias.css';
import './CartaoPagarLancado.css';
import './CartaoCobertura.css';

/**
 * Quantos dias o saldo de hoje paga: o número grande, uma régua com um quadrado por dia (preenchidos
 * os cobertos, contornados até a referência) e os últimos meses em barras, com o de hoje destacado.
 */
export function CartaoCobertura({ cartao }: { cartao: Dados }) {
  const idTitulo = useId();
  const { regua, serie } = cartao;
  const classe = STATUS[cartao.status].classe;
  // posição do fim do n-ésimo quadrado, descontando o vão entre eles
  const ate = (n: number) => `calc((100% + 3px) * ${n} / ${regua.total} - 1.5px)`;
  const teto = Math.max(serie.media.valor, ...serie.valores) * 1.15 || 1;
  const altura = (v: number) => `${(v / teto) * 100}%`;
  const ultimo = serie.valores.length - 1;

  return (
    <article className="card fin" aria-labelledby={idTitulo}>
      <CabecalhoCartao
        idTitulo={idTitulo}
        titulo={cartao.titulo}
        subtitulo={cartao.subtitulo}
        status={cartao.status}
        explicacao={cartao.explicacao}
      />
      <div className="cb3">
        <div className="fx-lead">
          <b className={`fx-big t-${classe}`}>{formatarValor(cartao.dias)}</b>
          <p>
            <Trechos trechos={cartao.texto} />
          </p>
          <span className="r-sub">{cartao.nota}</span>
        </div>
        <div
          className={`cb-strip s-${classe}`}
          role="img"
          aria-label={`${regua.rotuloCobertos}, de ${regua.total} dias; ${regua.rotuloReferencia}`}
        >
          <div className="cb-up">
            <span className="cb-mk" style={{ left: ate(regua.cobertos) }}>
              {regua.rotuloCobertos}
            </span>
          </div>
          <div className="cb-days" style={{ '--cb-n': regua.total } as CSSProperties}>
            {Array.from({ length: regua.total }, (_, i) => (
              <i key={i} className={i < regua.cobertos ? 'f' : i < regua.referencia ? 'o' : undefined} />
            ))}
          </div>
          <div className="cb-dn">
            <span className="cb-l">{regua.inicio}</span>
            <span className="cb-mk" style={{ left: ate(regua.referencia) }}>
              {regua.rotuloReferencia}
            </span>
            <span className="cb-r">{regua.fim}</span>
          </div>
        </div>
        <div>
          <p className="fx-cap">{serie.titulo}</p>
          <div
            className={`mb s-${classe}`}
            role="img"
            aria-label={`${serie.titulo}: ${serie.rotulos.map((r, i) => `${r} ${serie.valores[i] ?? ''}`).join(', ')}`}
          >
            {serie.valores.map((v, i) => (
              <span
                key={serie.rotulos[i] ?? i}
                className={i === ultimo ? 'now' : undefined}
                style={{ height: altura(v) }}
                title={`${serie.rotulos[i] ?? ''}: ${v}`}
                data-v={i === ultimo ? v : undefined}
              />
            ))}
            <i className="mb-avg" style={{ bottom: altura(serie.media.valor) }}>
              <em>{serie.media.rotulo}</em>
            </i>
          </div>
          <div className="mb-x" aria-hidden="true">
            <span>{serie.rotulos[0]}</span>
            <span>{serie.rotulos[ultimo]}</span>
          </div>
        </div>
      </div>
      <MarcaDagua variante="cartao" />
    </article>
  );
}
