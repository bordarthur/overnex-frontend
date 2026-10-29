import { Link } from 'react-router';
import { Gauge, LegendaGauge } from '../charts/Gauge';
import { MiniTendencia } from '../charts/MiniTendencia';
import type { Indicador, PeriodoId, Valor } from '../contracts/visaoGeral';
import { formatarDelta, formatarRotulo, formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { Pill } from './Pill';
import { Segmentado } from './Segmentado';
import './IndicadorGauge.css';

interface Props {
  indicador: Indicador;
  /** a chave Mês/Acumulado do cartão: as opções vêm de `periodos` do payload */
  periodos: { id: PeriodoId; rotulo: string }[];
  periodo: PeriodoId;
  onPeriodo: (id: PeriodoId) => void;
  /** caminho da tela de `telaDestino`, quando ela existe no front */
  destino?: string;
}

/** Seta do delta pelo sinal, como no mockup; delta em texto ganha seta só se começar com sinal. */
function seta(delta: Valor | string): string {
  const v =
    typeof delta === 'string' ? (delta.startsWith('+') ? 1 : /^[-−]/.test(delta) ? -1 : 0) : delta.valor;
  return v > 0 ? '▲ ' : v < 0 ? '▼ ' : '';
}

/** Cartão de indicador: velocímetro, valor, delta, referência e minitendência do período escolhido. */
export function IndicadorGauge({ indicador, periodos, periodo, onPeriodo, destino }: Props) {
  const p = indicador.periodos[periodo];
  const { gauge, tendencia } = indicador;
  const valor = formatarValor(p.valor);

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
      {periodos.length > 1 && (
        <Segmentado
          className="tseg"
          rotulo={`Período do cartão ${indicador.nome}`}
          opcoes={periodos}
          valor={periodo}
          onMudar={onPeriodo}
        />
      )}
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
        {p.delta != null && (
          <span className={`ft-delta ${p.deltaRuim ? 't-crit' : 't-ok'}`}>
            <span aria-hidden="true">{seta(p.delta)}</span>
            {typeof p.delta === 'string' ? p.delta : formatarDelta(p.delta)}
          </span>
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
      {destino && (
        <Link className="link ft-go" to={destino}>
          Ver painel
        </Link>
      )}
    </article>
  );
}
