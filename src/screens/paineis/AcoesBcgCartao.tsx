import { IconeQuadrante } from '../../components/IconeQuadrante';
import type { CartaoAcoesBcg } from '../../contracts/painel';
import { formatarExibicao } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import { useMudarFiltro } from './consultaPainel';
import './Bcg.css';

// o filtro da tela que cada item troca (o id do quadrante é o id da opção dele)
const FILTRO_CLASSE = 'classe';

/**
 * O que fazer em cada quadrante: clicar num item filtra a tela pela Classe BCG dele (destaca o
 * quadrante na matriz); clicar de novo no item escolhido volta a todas.
 */
export function AcoesBcgCartao({ cartao }: { cartao: CartaoAcoesBcg }) {
  const mudarFiltro = useMudarFiltro();
  return (
    <CaixaCartao cartao={cartao}>
      <div className="es-quads">
        {cartao.itens.map((item) => (
          <button
            key={item.quadrante}
            type="button"
            className={`es-q q-${item.quadrante}`}
            aria-pressed={item.selecionado}
            onClick={() => mudarFiltro(FILTRO_CLASSE, item.selecionado ? null : item.quadrante)}
          >
            <span className="qic">
              <IconeQuadrante quadrante={item.quadrante} tamanho={20} />
            </span>
            <span className="qt">
              <b>{item.rotulo}</b>
              <em>{item.nota}</em>
            </span>
            <span className="qa">{item.acao}</span>
            <span className="qnums">
              {item.numeros.map((n) => (
                <span key={n.rotulo}>
                  <b className={n.status ? `t-${STATUS[n.status].classe}` : undefined}>
                    {formatarExibicao(n.valor)}
                  </b>
                  {n.rotulo}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </CaixaCartao>
  );
}
