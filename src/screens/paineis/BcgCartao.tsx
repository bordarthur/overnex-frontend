import { useCallback, useRef, useState } from 'react';
import { MatrizBcg } from '../../charts/MatrizBcg';
import type { CartaoBcg } from '../../contracts/painel';
import { CaixaCartao } from './CaixaCartao';
import './Bcg.css';

/**
 * Matriz BCG do Estoque: as famílias e, com o clique numa delas, os produtos dela no mesmo gráfico,
 * com a trilha para voltar. A família aberta continua aberta quando os filtros mudam, se ela ainda
 * vier na resposta.
 */
export function BcgCartao({ cartao }: { cartao: CartaoBcg }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const familia = aberta ? cartao.pontos.find((p) => p.id === aberta && p.produtos) : undefined;
  // ao abrir uma família, o foco vai para o "voltar" quando ele aparece (a bolha clicada some)
  const focarVoltar = useRef(false);
  const voltar = useCallback((botao: HTMLButtonElement | null) => {
    if (botao && focarVoltar.current) {
      botao.focus();
      focarVoltar.current = false;
    }
  }, []);

  return (
    <CaixaCartao
      cartao={familia?.subtituloAberto ? { ...cartao, subtitulo: familia.subtituloAberto } : cartao}
    >
      <p className="bcg-trilha">
        {familia ? (
          <>
            <button ref={voltar} type="button" className="link" onClick={() => setAberta(null)}>
              {cartao.rotuloVoltar}
            </button>
            <span aria-hidden="true">›</span>
            <b>{familia.trilha ?? familia.nome}</b>
          </>
        ) : (
          cartao.trilha
        )}
      </p>
      <MatrizBcg
        cartao={cartao}
        pontos={familia?.produtos ?? cartao.pontos}
        onAbrir={
          familia
            ? undefined
            : (p) => {
                focarVoltar.current = true;
                setAberta(p.id);
              }
        }
        aria={familia ? `${cartao.titulo}: produtos de ${familia.nome}` : cartao.titulo}
      />
      <div className="legend bcg-leg">
        {cartao.quadrantes.map((q) => (
          <span key={q.id}>
            <i className={`qd q-${q.id}`} aria-hidden="true" />
            {q.rotulo}
          </span>
        ))}
      </div>
    </CaixaCartao>
  );
}
