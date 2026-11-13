import type { CartaoDesvios } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './Desvios.css';

/** Grupos de contas com o desvio de cada uma ("Pioram o resultado", "Melhoram o resultado"). */
export function Desvios({ cartao }: { cartao: CartaoDesvios }) {
  const { escala } = cartao;
  return (
    <CaixaCartao cartao={cartao}>
      {cartao.grupos.map((g) => {
        const classe = STATUS[g.status].classe;
        return (
          <section key={g.titulo} className="dv-grupo" aria-label={g.titulo}>
            <h3 className={`dv-h t-${classe}`}>{g.titulo}</h3>
            <ul className="dv-lista">
              {g.itens.map((i) => (
                <li key={i.nome} className={`dv dv-${classe}`}>
                  <span className="dv-nome">
                    {i.nome}
                    {i.detalhe && <span className="r-sub">{i.detalhe}</span>}
                  </span>
                  <b className="num">{formatarValor({ valor: i.valor, ...escala }, { comSinal: true })}</b>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </CaixaCartao>
  );
}
