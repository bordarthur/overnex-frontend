import { useId } from 'react';
import { Linha } from '../charts/Linha';
import type { CartaoInadimplencia as Dados } from '../contracts/visaoGeral';
import { formatarRotulo, formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { BarraIdade } from './BarraIdade';
import { CabecalhoCartao } from './CabecalhoCartao';
import { MarcaDagua } from './MarcaDagua';
import { LinhaDica } from './Tooltip';
import { Trechos } from './Trechos';
import './CartaoInadimplencia.css';

// Os textos fixos aqui descrevem o tipo de cartão ('inadimplencia'), não uma seção ou indicador do cliente.
export function CartaoInadimplencia({ cartao }: { cartao: Dados }) {
  const idTitulo = useId();
  const { serie, carteira } = cartao;
  const unidade = cartao.percentual.unidade;
  const ultimo = serie.valores.length - 1;

  return (
    <article className="card inad" aria-labelledby={idTitulo}>
      <CabecalhoCartao
        idTitulo={idTitulo}
        titulo={cartao.titulo ?? 'Inadimplência'}
        subtitulo={cartao.subtitulo ?? 'Quanto da carteira a receber já venceu e há quanto tempo'}
        status={cartao.status}
        explicacao={cartao.explicacao}
      />
      <div className="ic2">
        <div className="inad-big">
          <b className={`inad-num t-${STATUS[cartao.status].classe}`}>{formatarValor(cartao.percentual)}</b>
          <p>
            <Trechos trechos={cartao.texto} />
          </p>
          <span className="r-sub">{cartao.nota}</span>
        </div>
        {/* a faixa "só na barra" (o a vencer) leva o texto dentro e não ganha quadro nem fita */}
        <BarraIdade faixas={carteira} sufixo="da carteira" aria="Carteira a receber por faixa de atraso" />
        <div>
          <Linha
            rotulos={serie.rotulos}
            valores={serie.valores}
            altura={230}
            // rótulos com o ano ("out-26"): mais espaço entre eles no eixo
            xGap={56}
            padL={32}
            padR={40}
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
