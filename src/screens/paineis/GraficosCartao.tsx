import { Grafico } from '../../charts/Grafico';
import type { CartaoGraficos } from '../../contracts/painel';
import { CaixaCartao } from './CaixaCartao';
import './GraficosCartao.css';

/** Um gráfico ou vários lado a lado, cada um com título e nota. */
export function GraficosCartao({ cartao }: { cartao: CartaoGraficos }) {
  const varios = cartao.graficos.length > 1;
  return (
    <CaixaCartao cartao={cartao}>
      <div className={varios ? 'sm-grid' : undefined}>
        {cartao.graficos.map((g, i) => (
          <div key={i} className="sm">
            {g.titulo && <h3>{g.titulo}</h3>}
            <Grafico grafico={g.grafico} aria={g.titulo ? `${cartao.titulo}: ${g.titulo}` : cartao.titulo} />
            {g.nota && <p className="note sm-nota">{g.nota}</p>}
          </div>
        ))}
      </div>
    </CaixaCartao>
  );
}
