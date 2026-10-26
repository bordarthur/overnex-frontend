import { Trechos } from '../../components/Trechos';
import type { CartaoFatores } from '../../contracts/painel';
import { formatarExibicao } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './Fatores.css';

/** Total decomposto em fatores; o fator que mais explica a diferença vem marcado pela API. */
export function Fatores({ cartao }: { cartao: CartaoFatores }) {
  const { total } = cartao;
  return (
    <CaixaCartao cartao={cartao}>
      <div className="drv">
        <div className="drv-top">
          <span>{total.rotulo}</span>
          <b>{formatarExibicao(total.valor, { comSinal: total.comSinal })}</b>
          {total.contexto && (
            <span className={total.status ? `t-${STATUS[total.status].classe}` : undefined}>
              {total.contexto}
            </span>
          )}
        </div>
        {cartao.fatores.map((f) => (
          <div key={f.nome} className={`drv-row${f.causa ? ' cause' : ''}`}>
            <div className="drv-name">
              <span className="op" aria-hidden="true">
                {f.operador}
              </span>
              {f.nome}
            </div>
            <div className="drv-nums">
              {f.colunas.map((c) => (
                <span key={c.rotulo} className={c.status ? `t-${STATUS[c.status].classe}` : undefined}>
                  <small>{c.rotulo}</small>
                  {formatarExibicao(c.valor, { comSinal: c.comSinal })}
                </span>
              ))}
            </div>
          </div>
        ))}
        {cartao.conclusao && (
          <p className="drv-ins">
            <Trechos trechos={cartao.conclusao} />
          </p>
        )}
      </div>
    </CaixaCartao>
  );
}
