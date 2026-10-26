import type { CartaoMatriz } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './Matriz.css';

/** Matriz de contagens: com status, a cor do farol; sem, cinza mais forte quanto maior o valor. */
export function Matriz({ cartao }: { cartao: CartaoMatriz }) {
  const maior = Math.max(...cartao.valores.flat().map((c) => c.valor), 1);
  return (
    <CaixaCartao cartao={cartao}>
      <table className="cx-g">
        <thead>
          <tr>
            <td />
            {cartao.colunas.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cartao.linhas.map((l, i) => (
            <tr key={l}>
              <th scope="row">{l}</th>
              {(cartao.valores[i] ?? []).map((c, j) => (
                <td
                  key={j}
                  className={c.status ? `cx-${STATUS[c.status].classe}` : undefined}
                  style={
                    c.status
                      ? undefined
                      : {
                          background: `color-mix(in srgb, var(--c1) ${Math.round(10 + (c.valor / maior) * 40)}%, var(--surface))`,
                        }
                  }
                >
                  {formatarValor({ valor: c.valor, unidade: 'qtd' })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </CaixaCartao>
  );
}
