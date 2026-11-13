import { Trechos } from '../../components/Trechos';
import type { CartaoOrigemProjecao } from '../../contracts/painel';
import { formatarPct, formatarValor } from '../../format';
import { CaixaCartao } from './CaixaCartao';
import './OrigemProjecao.css';

/**
 * De onde vem a projeção: a barra do lançado contra o que falta lançar e uma linha por origem, com
 * a etiqueta (lançado, não lançado, V2). O que fica fora do saldo da visão escolhida vem riscado.
 */
export function OrigemProjecao({ cartao }: { cartao: CartaoOrigemProjecao }) {
  const { barra, texto, grupos } = cartao;
  return (
    <CaixaCartao cartao={cartao}>
      <div
        className="origem-barra"
        role="img"
        aria-label={barra.map((p) => `${p.rotulo}: ${formatarPct(p.proporcao * 100, 0)}`).join('; ')}
      >
        {barra.map((p) => (
          <span
            key={p.rotulo}
            className={`origem-parte ${p.estilo}`}
            style={{ width: `${p.proporcao * 100}%` }}
          />
        ))}
      </div>
      {texto && texto.length > 0 && (
        <p className="origem-texto">
          <Trechos trechos={texto} />
        </p>
      )}
      {grupos.map((g) => (
        <section key={g.titulo} className="origem-grupo" aria-label={g.titulo}>
          <h3>{g.titulo}</h3>
          <ul>
            {g.itens.map((i) => {
              const valor = formatarValor(i.valor);
              return (
                <li key={i.nome} className={i.riscado ? 'riscado' : undefined}>
                  <span className="origem-nome">{i.nome}</span>
                  <b className="origem-valor">
                    {i.riscado ? <s>{valor}</s> : valor}
                    {i.riscado && <span className="visualmente-oculto"> (fora do saldo desta visão)</span>}
                  </b>
                  <span className={`origem-tag ${i.etiqueta.estilo}`}>{i.etiqueta.rotulo}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </CaixaCartao>
  );
}
