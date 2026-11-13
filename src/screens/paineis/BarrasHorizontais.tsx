import type { CartaoBarrasHorizontais } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './BarrasHorizontais.css';

/** Lista de barras horizontais; a maior ocupa a largura toda (só geometria). */
export function BarrasHorizontais({ cartao }: { cartao: CartaoBarrasHorizontais }) {
  const { escala, itens } = cartao;
  const maior = Math.max(...itens.map((i) => Math.abs(i.valor)), 1);
  return (
    <CaixaCartao cartao={cartao}>
      <ul className="hbars">
        {itens.map((i) => (
          <li key={i.rotulo} className="hb">
            <span className="hb-nome">
              {i.rotulo}
              {i.sub && <span className="r-sub">{i.sub}</span>}
            </span>
            <span className="hb-trilho" aria-hidden="true">
              <span
                className={i.status ? `hb-${STATUS[i.status].classe}` : undefined}
                style={{ width: `${(Math.abs(i.valor) / maior) * 100}%` }}
              />
            </span>
            <b className="num">{formatarValor({ valor: i.valor, ...escala })}</b>
          </li>
        ))}
      </ul>
    </CaixaCartao>
  );
}
