import { useId } from 'react';
import { BarraEmpilhada } from '../charts/BarraEmpilhada';
import { Linha } from '../charts/Linha';
import type { CartaoInadimplencia as Dados } from '../contracts/visaoGeral';
import { formatarPct, formatarRotulo, formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { MarcaDagua } from './MarcaDagua';
import { Pill } from './Pill';
import { LinhaDica } from './Tooltip';
import { Trechos } from './Trechos';
import './CartaoInadimplencia.css';

// Os textos fixos aqui descrevem o tipo de cartão ('inadimplencia'), não uma seção ou indicador do cliente.
export function CartaoInadimplencia({ cartao }: { cartao: Dados }) {
  const idTitulo = useId();
  const { serie } = cartao;
  const unidade = cartao.percentual.unidade;
  const ultimo = serie.valores.length - 1;

  return (
    <article className="card inad" aria-labelledby={idTitulo}>
      <div className="card-h">
        <div>
          <h2 id={idTitulo}>
            Inadimplência <Pill status={cartao.status} />
          </h2>
          <p className="sub">Quanto da carteira a receber já venceu e há quanto tempo</p>
        </div>
      </div>
      <div className="inad-g">
        <div className="inad-big">
          <b className={`inad-num t-${STATUS[cartao.status].classe}`}>{formatarValor(cartao.percentual)}</b>
          <p>
            <Trechos trechos={cartao.texto} />
          </p>
          <span className="r-sub">{cartao.nota}</span>
        </div>
        <div>
          <BarraEmpilhada
            aria="Carteira a receber por faixa de atraso"
            larguraMinima={3.2}
            segmentos={cartao.carteira.map((x) => ({
              chave: x.rotulo,
              largura: x.percentual,
              status: x.status,
              titulo: `${x.rotulo}: ${formatarValor(x.valor)}`,
            }))}
          />
          <div className="aging-tiles">
            {cartao.carteira.map((x) => (
              <div key={x.rotulo} className={`at ${STATUS[x.status].classe}`}>
                <span>{x.rotulo}</span>
                <b>{formatarValor(x.valor)}</b>
                <em>{formatarPct(x.percentual)} da carteira</em>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Linha
            rotulos={serie.rotulos}
            valores={serie.valores}
            altura={150}
            // rótulos com o ano ("out-26"): mais espaço entre eles no eixo
            xGap={56}
            padL={30}
            padR={12}
            piso={0}
            referencia={{ valor: serie.media, rotulo: `média ${formatarRotulo(serie.media, unidade, 1)}` }}
            marcadores={
              ultimo >= 0
                ? [{ i: ultimo, rotulo: formatarRotulo(serie.valores[ultimo] ?? 0, unidade, 1) }]
                : []
            }
            formatarEixo={(v) => formatarRotulo(v, unidade, 0)}
            aria="Inadimplência em 12 meses"
            animar
            dica={(i) => (
              <>
                <b>{serie.rotulos[i]}</b>
                <LinhaDica
                  rotulo="Vencido sobre a carteira"
                  valor={formatarRotulo(serie.valores[i] ?? 0, unidade, 1)}
                />
              </>
            )}
          />
          <p className="note inad-nota">Vencido sobre a carteira, 12 meses</p>
        </div>
      </div>
      <MarcaDagua variante="cartao" />
    </article>
  );
}
