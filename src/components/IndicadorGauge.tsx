import { Gauge, LegendaGauge } from '../charts/Gauge';
import { MiniTendencia } from '../charts/MiniTendencia';
import type { Indicador, PeriodoId } from '../contracts/visaoGeral';
import { formatarDelta, formatarRotulo, formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { Pill } from './Pill';
import './IndicadorGauge.css';

/** Cartão de indicador: velocímetro, valor, delta, referência e minitendência do período escolhido. */
export function IndicadorGauge({ indicador, periodo }: { indicador: Indicador; periodo: PeriodoId }) {
  const p = indicador.periodos[periodo];
  const { gauge, tendencia } = indicador;
  const valor = formatarValor(p.valor);

  // TODO(navegação): quando a tela `telaDestino` existir, o cartão vira um link para ela. Por ora não navega.
  return (
    <article
      className={`ftile gt-tile st-${STATUS[p.status].classe}`}
      aria-label={indicador.nome}
      data-tela-destino={indicador.telaDestino}
    >
      <div className="ft-head">
        <span>
          {indicador.nome}
          {indicador.origem === 'cadastro' && (
            <span className="nodw" title="Valor vem de cadastro manual, não do sistema do cliente">
              cadastro
            </span>
          )}
        </span>
        <Pill status={p.status} />
      </div>
      <Gauge
        min={gauge.min}
        max={gauge.max}
        meta={gauge.meta}
        unidade={gauge.unidade}
        faixas={gauge.faixas}
        ponteiro={p.ponteiro}
        rotuloAria={`${indicador.nome}: ${valor}, ${p.referencia}`}
      />
      <LegendaGauge faixas={gauge.faixas} unidade={gauge.unidade} />
      <div className="ft-main">
        <span className="ft-val">{valor}</span>
        {p.delta && (
          <span className={`ft-delta ${p.deltaRuim ? 't-crit' : 't-ok'}`}>{formatarDelta(p.delta)}</span>
        )}
      </div>
      <div className="ft-ref">{p.referencia}</div>
      <MiniTendencia
        rotulos={tendencia.rotulos}
        real={tendencia.real}
        referencia={tendencia.referencia}
        faixa={tendencia.faixa}
        status={p.status}
        formatar={(v) => formatarRotulo(v, tendencia.unidade, tendencia.casas)}
      />
    </article>
  );
}
