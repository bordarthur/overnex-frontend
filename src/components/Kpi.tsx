import type { Kpi as KpiDados } from '../contracts/visaoGeral';
import { formatarValor } from '../format';
import { STATUS } from '../theme/status';
import './Kpi.css';

export function Kpi({ kpi }: { kpi: KpiDados }) {
  return (
    <div className={`kpi${kpi.status ? ` s-${STATUS[kpi.status].classe}` : ''}`}>
      <span className="k-l">{kpi.rotulo}</span>
      <b className="k-v">{formatarValor(kpi.valor)}</b>
      <span className="k-s">{kpi.contexto}</span>
    </div>
  );
}

/** Linha de KPIs. Até 4 por linha; 3, 5 e 6 usam as grades .three, .five e .six (sem buraco no fim). */
export function LinhaKpis({ kpis }: { kpis: KpiDados[] }) {
  const extra = kpis.length === 3 ? ' three' : kpis.length === 5 ? ' five' : kpis.length >= 6 ? ' six' : '';
  return (
    <div className={`kpis${extra}`}>
      {kpis.map((k, i) => (
        <Kpi key={`${i}-${k.rotulo}`} kpi={k} />
      ))}
    </div>
  );
}
