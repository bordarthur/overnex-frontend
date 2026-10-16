import type { Status } from '../contracts/visaoGeral';
import { STATUS } from '../theme/status';
import './charts.css';

interface Segmento {
  chave: string;
  /** largura em % da barra */
  largura: number;
  status: Status;
  titulo: string;
}

/** Barra horizontal empilhada (barra da carteira no cartão de Inadimplência). */
export function BarraEmpilhada({
  segmentos,
  larguraMinima = 0,
  aria,
}: {
  segmentos: Segmento[];
  larguraMinima?: number;
  aria: string;
}) {
  return (
    <div className="barra-empilhada" role="img" aria-label={aria}>
      {segmentos.map((s) => (
        <span
          key={s.chave}
          className={`be-${STATUS[s.status].classe}`}
          style={{ width: `${Math.max(s.largura, larguraMinima)}%` }}
          title={s.titulo}
        />
      ))}
    </div>
  );
}
