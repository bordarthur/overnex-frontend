import { formatarEixo } from '../../charts/escala';
import type { CartaoFaixas } from '../../contracts/painel';
import { CaixaCartao } from './CaixaCartao';
import './Faixas.css';

/** Duas barras por faixa (ex.: participação nos atendimentos e na receita). */
export function Faixas({ cartao }: { cartao: CartaoFaixas }) {
  const fmt = formatarEixo(cartao.escala);
  // a maior barra ocupa a largura toda; só geometria
  const maior = Math.max(...cartao.linhas.flatMap((l) => l.valores), 1);
  return (
    <CaixaCartao cartao={cartao}>
      <div className="legend legend-grafico">
        <span>
          <i className="quadrado-claro" aria-hidden="true" />
          {cartao.series[0]}
        </span>
        <span>
          <i className="quadrado-escuro" aria-hidden="true" />
          {cartao.series[1]}
        </span>
      </div>
      <div className="faixas">
        {cartao.linhas.map((l) => (
          <div key={l.rotulo} className="fx">
            <span className="fx-n">{l.rotulo}</span>
            {l.valores.map((v, j) => (
              <div key={j} className="fx-b">
                <span
                  className={j === 0 ? 'b1' : 'b2'}
                  // até 80% da linha: o resto fica para o número
                  style={{ width: `${(v / maior) * 80}%` }}
                  aria-hidden="true"
                />
                <em>
                  <span className="visualmente-oculto">{cartao.series[j]}: </span>
                  {fmt(v)}
                </em>
              </div>
            ))}
          </div>
        ))}
      </div>
    </CaixaCartao>
  );
}
