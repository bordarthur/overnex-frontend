import type { Kpi as KpiDados } from '../contracts/visaoGeral';
import { formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { caber } from './caber';
import { colunasDaGrade } from './grade';
import './Kpi.css';

export function Kpi({ kpi }: { kpi: KpiDados }) {
  const valor = formatarValor(kpi.valor);
  return (
    <div className={`kpi${kpi.status ? ` s-${STATUS[kpi.status].classe}` : ''}`}>
      <span className="k-l">{kpi.rotulo}</span>
      <b className="k-v cabe" style={caber(valor)}>
        {valor}
      </b>
      <span className="k-s">{kpi.contexto}</span>
    </div>
  );
}

/**
 * Linha de KPIs, na mesma grade dos velocímetros (grade.ts): a quantidade que veio da API decide as
 * linhas, sem buraco no fim (5 = 3 + 2, 6 = 3 + 3).
 */
export function LinhaKpis({ kpis }: { kpis: KpiDados[] }) {
  return (
    <div className={`kpis n-${colunasDaGrade(kpis.length)}`}>
      {kpis.map((k, i) => (
        <Kpi key={`${i}-${k.rotulo}`} kpi={k} />
      ))}
    </div>
  );
}
