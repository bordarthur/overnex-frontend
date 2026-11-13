import { Linhas } from '../../charts/Linhas';
import { Trechos } from '../../components/Trechos';
import type { CartaoCicloCaixa } from '../../contracts/painel';
import { CaixaCartao } from './CaixaCartao';
import './CicloCaixa.css';

/** Réguas do ciclo de caixa (estoque, recebimento, pagamento e o dinheiro preso) e os prazos mês a mês. */
export function CicloCaixa({ cartao }: { cartao: CartaoCicloCaixa }) {
  const { linhas, rodape = [], grafico } = cartao;
  // escala comum às réguas: o maior fim de trecho (só geometria)
  const fim = Math.max(1, ...linhas.flatMap((l) => l.trechos.map((t) => t.ate)));
  const pos = (v: number) => `${(v / fim) * 100}%`;
  return (
    <CaixaCartao cartao={cartao}>
      <div className="cycle">
        {linhas.map((l) => (
          <div key={l.rotulo} className="cy">
            <span>{l.rotulo}</span>
            <div
              className="cy-track"
              role="img"
              aria-label={`${l.rotulo}: ${l.trechos.map((t) => t.rotulo).join(', ')}`}
            >
              {l.trechos.map((t) => (
                <span
                  key={t.estilo + t.de}
                  className={`cy-seg ${t.estilo}`}
                  style={{ left: pos(t.de), width: pos(Math.max(0, t.ate - t.de)) }}
                >
                  {t.rotulo}
                </span>
              ))}
            </div>
          </div>
        ))}
        {rodape.length > 0 && (
          <div className="cy-foot">
            {rodape.map((frase, i) => (
              <span key={i}>
                <Trechos trechos={frase} />
              </span>
            ))}
          </div>
        )}
      </div>
      {grafico && <Linhas grafico={grafico} aria={`${cartao.titulo}: prazos mês a mês`} altura={210} />}
    </CaixaCartao>
  );
}
