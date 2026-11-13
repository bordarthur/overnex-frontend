import { Grafico } from '../../charts/Grafico';
import { Trechos } from '../../components/Trechos';
import type { CartaoNumeroGrafico } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './NumeroGrafico.css';

/** Número grande com o texto que o explica e a variação, ao lado do gráfico dele. */
export function NumeroGrafico({ cartao }: { cartao: CartaoNumeroGrafico }) {
  const { numero, grafico } = cartao;
  const { variacao } = numero;
  const seta = variacao ? (variacao.valor.valor > 0 ? '▲ ' : variacao.valor.valor < 0 ? '▼ ' : '') : '';
  return (
    <CaixaCartao cartao={cartao}>
      <div className="fpc">
        <div className="fpc-big">
          <b>{formatarValor(numero.valor)}</b>
          <p>
            <Trechos trechos={numero.texto} />
          </p>
          {variacao && (
            <span className={`fpc-arrow t-${STATUS[variacao.tom].classe}`}>
              {seta}
              {formatarValor(variacao.valor)} {variacao.texto}
            </span>
          )}
          {numero.nota && <span className="r-sub">{numero.nota}</span>}
        </div>
        <Grafico grafico={grafico} aria={cartao.titulo} altura={220} />
      </div>
    </CaixaCartao>
  );
}
