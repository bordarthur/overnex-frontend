import type { CartaoSaudeEstoque } from '../../contracts/painel';
import { formatarExibicao, formatarValor } from '../../format';
import { CaixaCartao } from './CaixaCartao';
import './Estoque.css';

/**
 * Saúde do estoque: em valor e em produtos, quanto está em cada faixa (zerado, abaixo do mínimo,
 * ideal, excesso, parado), em duas barras empilhadas e na lista por grupo (Falta, No ponto, Sobra).
 */
export function SaudeEstoqueCartao({ cartao }: { cartao: CartaoSaudeEstoque }) {
  const faixas = new Map(cartao.grupos.flatMap((g) => g.faixas.map((f) => [f.id, f])));
  return (
    <CaixaCartao cartao={cartao}>
      {cartao.barras.map((b) => {
        const soma = b.partes.reduce((a, p) => a + Math.max(0, p.valor), 0) || 1;
        return (
          <div key={b.rotulo} className="sd-linha">
            <div className="sd-rotulo">
              <span>{b.rotulo}</span>
              <span>{formatarExibicao(b.total)}</span>
            </div>
            <div className="sd-barra" aria-hidden="true">
              {b.partes
                .filter((p) => p.valor > 0)
                .map((p) => {
                  const f = faixas.get(p.faixa);
                  return (
                    <span
                      key={p.faixa}
                      className={`ef-${f?.estilo ?? 'saudavel'}`}
                      style={{ flexGrow: p.valor / soma }}
                      title={f?.rotulo}
                    />
                  );
                })}
            </div>
          </div>
        );
      })}
      {cartao.grupos.map((g) => (
        <section key={g.rotulo} className="sd-grupo" aria-label={g.rotulo}>
          <h3>{g.rotulo}</h3>
          <ul>
            {g.faixas.map((f) => (
              <li key={f.id} className="sd-item">
                <i className={`ef-${f.estilo}`} aria-hidden="true" />
                <span>
                  {f.rotulo}
                  <small>{f.sub}</small>
                </span>
                <span className="sd-num apagado">{formatarExibicao(f.produtos)}</span>
                <span className="sd-num">
                  <b>{f.valor ? formatarValor(f.valor) : '—'}</b>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </CaixaCartao>
  );
}
