import { IconeStatus } from '../../components/Pill';
import type { CartaoContraMeta, ItemContraMeta } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './ContraMeta.css';

/** Barras contra a meta de cada item: blocos (canais) ou ranking (vendedores). */
export function ContraMeta({ cartao }: { cartao: CartaoContraMeta }) {
  return (
    <CaixaCartao cartao={cartao}>
      {cartao.itens.length === 0 ? (
        <p className="empty">Nada para mostrar com esses filtros.</p>
      ) : cartao.layout === 'ranking' ? (
        <Ranking cartao={cartao} />
      ) : (
        <Blocos cartao={cartao} />
      )}
    </CaixaCartao>
  );
}

function Atingimento({ item }: { item: ItemContraMeta }) {
  return (
    <span className={`pct t-${STATUS[item.status].classe}`}>
      <IconeStatus status={item.status} />
      {formatarValor(item.atingimento)}
    </span>
  );
}

interface PropsBarra {
  realizado: number;
  meta: number;
  // valor no fim da barra
  escala: number;
  status: ItemContraMeta['status'];
  rotuloMeta: string;
}

// Geometria só: posição da barra e do traço da meta na escala do cartão.
function BarraMeta({ realizado, meta, escala, status, rotuloMeta }: PropsBarra) {
  const pos = (v: number) => `${Math.min(1, Math.max(0, v / escala)) * 100}%`;
  return (
    <span className="abar" aria-hidden="true">
      <span className={`ab-v ${STATUS[status].classe}`} style={{ width: pos(realizado) }} />
      <i style={{ left: pos(meta) }} />
      <em style={{ left: pos(meta) }}>{rotuloMeta}</em>
    </span>
  );
}

function Blocos({ cartao }: { cartao: CartaoContraMeta }) {
  return (
    <div className="canais">
      {cartao.itens.map((it) => (
        <div key={it.nome} className="canal-b">
          <div className="cb-h">
            <b>{it.nome}</b>
            <Atingimento item={it} />
          </div>
          {/* barra até 130% da meta de cada canal, como no mockup */}
          <BarraMeta
            realizado={it.realizado.valor}
            meta={it.meta.valor}
            escala={it.meta.valor * 1.3}
            status={it.status}
            rotuloMeta={cartao.rotuloMeta}
          />
          <div className="cb-n">
            <span>
              {cartao.rotuloRealizado} <b>{formatarValor(it.realizado)}</b> de {formatarValor(it.meta)}
            </span>
            {it.diferenca && (
              <b className={it.diferencaRuim ? 't-crit' : 't-ok'}>
                {formatarValor(it.diferenca, { comSinal: true })}
              </b>
            )}
          </div>
          {it.detalhes && it.detalhes.length > 0 && (
            <div className="cb-n muted">
              {it.detalhes.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Ranking({ cartao }: { cartao: CartaoContraMeta }) {
  // mesma escala para todos, para as barras serem comparáveis
  const escala = Math.max(...cartao.itens.flatMap((it) => [it.realizado.valor, it.meta.valor]), 1) * 1.04;
  return (
    <ol className="rank">
      {cartao.itens.map((it, i) => (
        <li key={it.nome} className="rank-row">
          <span className="rk">{i + 1}</span>
          <span className="r-name">
            {it.nome}
            {it.detalhe && <span className="canal">{it.detalhe}</span>}
          </span>
          <BarraMeta
            realizado={it.realizado.valor}
            meta={it.meta.valor}
            escala={escala}
            status={it.status}
            rotuloMeta={`${cartao.rotuloMeta} ${formatarValor(it.meta)}`}
          />
          <span className="right num">
            <Atingimento item={it} />
          </span>
          <span className="right num rank-valor">
            <b>{formatarValor(it.realizado)}</b>
            <span className="r-sub">{cartao.rotuloRealizado}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
