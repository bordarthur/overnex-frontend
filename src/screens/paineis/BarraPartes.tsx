import { Trechos } from '../../components/Trechos';
import type { CartaoBarraPartes } from '../../contracts/painel';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './BarraPartes.css';

/** Uma barra dividida em partes (equilíbrio e folga), com a escala embaixo e o texto que explica. */
export function BarraPartes({ cartao }: { cartao: CartaoBarraPartes }) {
  return (
    <CaixaCartao cartao={cartao}>
      <div className="bp-bar">
        {cartao.partes.map((p) => (
          <span
            key={p.rotulo}
            className={p.estilo === 'serie-clara' ? 'bp-clara' : `bp-${STATUS[p.estilo].classe}`}
            style={{ width: `${p.proporcao * 100}%` }}
          >
            {p.rotulo}
          </span>
        ))}
      </div>
      <div className="bp-escala">
        <span>{cartao.escala.inicio}</span>
        <span>{cartao.escala.fim}</span>
      </div>
      {cartao.texto && (
        <p className="bp-texto">
          <Trechos trechos={cartao.texto} />
        </p>
      )}
    </CaixaCartao>
  );
}
