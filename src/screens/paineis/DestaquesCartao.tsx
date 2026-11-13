import type { CSSProperties } from 'react';
import type { CartaoDestaques } from '../../contracts/painel';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './DestaquesCartao.css';

/** Cartões lado a lado para reconhecer quem entrega e apoiar quem tem dificuldade. */
export function DestaquesCartao({ cartao }: { cartao: CartaoDestaques }) {
  // de 1 a 4 itens: as colunas acompanham a quantidade, sem buraco no fim da linha
  const n = cartao.itens.length;
  const colunas = { '--hl-colunas': Math.min(n, 4), '--hl-colunas-meio': Math.min(n, 2) } as CSSProperties;
  return (
    <CaixaCartao cartao={cartao}>
      <div className="hl" style={colunas}>
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
