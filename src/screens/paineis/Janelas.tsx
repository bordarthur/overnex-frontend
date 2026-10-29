import type { CSSProperties } from 'react';
import { IconeStatus, Pill } from '../../components/Pill';
import { Trechos } from '../../components/Trechos';
import type { CartaoJanelas } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './Janelas.css';

/** Janelas de dias lado a lado (entra, sai, sobra e saldo no fim), com um alerta ao fim. */
export function Janelas({ cartao }: { cartao: CartaoJanelas }) {
  const { janelas, alerta } = cartao;
  return (
    <CaixaCartao cartao={cartao}>
      <div
        className={`janelas${alerta ? ' com-alerta' : ''}`}
        style={{ '--janelas': janelas.length } as CSSProperties}
      >
        {janelas.map((j) => (
          <section key={j.titulo} className="jan" aria-label={j.titulo}>
            <h3 className="jan-h">
              {j.titulo} {j.status && <Pill status={j.status} />}
            </h3>
            {j.linhas.map((l) => {
              const classes = ['jan-r'];
              if (l.tipo === 'total') classes.push('tot');
              if (l.tipo === 'saldo') classes.push('sal', j.status ? `cf-${STATUS[j.status].classe}` : '');
              return (
                <div key={l.rotulo} className={classes.filter(Boolean).join(' ')}>
                  <span>{l.rotulo}</span>
                  <b className={l.tom ? `t-${STATUS[l.tom].classe}` : undefined}>
                    {formatarValor(l.valor, { comSinal: l.comSinal })}
                  </b>
                </div>
              );
            })}
          </section>
        ))}
        {alerta && (
          <div className="jan jan-alerta">
            <span className="qchip">
              <IconeStatus status="atencao" />
              {alerta.etiqueta}
            </span>
            <p>
              <Trechos trechos={alerta.texto} />
            </p>
            {alerta.rodape && <span className="r-sub">{alerta.rodape}</span>}
          </div>
        )}
      </div>
    </CaixaCartao>
  );
}
