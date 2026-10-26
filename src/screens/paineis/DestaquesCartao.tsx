import type { CartaoDestaques } from '../../contracts/painel';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './DestaquesCartao.css';

/** Cartões lado a lado para reconhecer quem entrega e apoiar quem tem dificuldade. */
export function DestaquesCartao({ cartao }: { cartao: CartaoDestaques }) {
  return (
    <CaixaCartao cartao={cartao}>
      <div className="hl">
        {cartao.itens.map((it) => (
          <div key={it.categoria} className={`hlc ${STATUS[it.status].classe}`}>
            <span className="hl-k">{it.categoria}</span>
            <b>{it.titulo}</b>
            <span>{it.texto}</span>
          </div>
        ))}
      </div>
    </CaixaCartao>
  );
}
