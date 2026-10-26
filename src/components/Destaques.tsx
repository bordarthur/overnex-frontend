import type { ItemValor } from '../contracts/painel';
import { formatarExibicao } from '../format';
import { STATUS } from '../theme/status';
import { Pill } from './Pill';
import './Destaques.css';

/** Os números grandes do topo do painel (heroes do mockup), entre duas linhas. */
export function Destaques({ itens }: { itens: ItemValor[] }) {
  return (
    <div className="heroes" style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
      {itens.map((d) => (
        <div key={d.rotulo} className="hero">
          <div className="h-top">
            <span className="h-label">{d.rotulo}</span>
            {d.status && <Pill status={d.status} />}
          </div>
          <strong className={`h-num${d.status === 'critico' ? ` t-${STATUS.critico.classe}` : ''}`}>
            {formatarExibicao(d.valor, { comSinal: d.comSinal })}
          </strong>
          {d.contexto && <span className="h-ctx">{d.contexto}</span>}
        </div>
      ))}
    </div>
  );
}

/** Números de apoio, em linha, logo abaixo dos destaques. */
export function Apoios({ itens }: { itens: ItemValor[] }) {
  return (
    <div className="apoios">
      {itens.map((a) => (
        <span key={a.rotulo} className="apoio">
          {a.rotulo}
          <b className={a.status ? `t-${STATUS[a.status].classe}` : undefined}>
            {formatarExibicao(a.valor, { comSinal: a.comSinal })}
          </b>
        </span>
      ))}
    </div>
  );
}
