import type { Status } from '../contracts/visaoGeral';
import { ORDEM_STATUS, STATUS } from '../theme/status';
import { Simbolo } from './Marca';
import { IconeStatus } from './Pill';
import './FaixaSecao.css';

interface PropsFaixa {
  idTitulo: string;
  titulo: string;
  modulo: string | null;
  resumo: string;
  /** quantos indicadores da seção estão em cada status, no período escolhido */
  contagem: Record<Status, number>;
}

/** Faixa grafite que abre cada seção da Visão geral. */
export function FaixaSecao({ idTitulo, titulo, modulo, resumo, contagem }: PropsFaixa) {
  return (
    <div className="vg-band">
      <Simbolo className="vb-sym" />
      <h3 id={idTitulo}>{titulo}</h3>
      {modulo && (
        <span className="vb-mod" data-testid="etiqueta-modulo">
          Módulo {modulo}
        </span>
      )}
      <span className="vb-score" data-testid="contagem-status">
        {ORDEM_STATUS.filter((s) => contagem[s] > 0).map((s) => (
          <span key={s} className={`vb-chip ${STATUS[s].classe}`}>
            <IconeStatus status={s} />
            {contagem[s]} {STATUS[s].rotulo.toLowerCase()}
          </span>
        ))}
      </span>
      <p className="vb-take">{resumo}</p>
    </div>
  );
}
