import { Kpi } from '../../components/Kpi';
import { IconeStatus } from '../../components/Pill';
import { Trechos } from '../../components/Trechos';
import type { CartaoDoisLados } from '../../contracts/painel';
import { formatarPct, formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
// faixas de idade (.aging-tiles e .at), as mesmas do cartão de inadimplência
import '../../components/CartaoInadimplencia.css';
import './DoisLados.css';

/** Duas metades lado a lado (contas a receber × a pagar): KPIs, idade dos títulos e maiores saldos. */
export function DoisLados({ cartao }: { cartao: CartaoDoisLados }) {
  return (
    <CaixaCartao cartao={cartao}>
      <div className="lados">
        {cartao.lados.map((lado) => (
          <section key={lado.titulo} className="lado" aria-label={lado.titulo}>
            <div className="lado-h">
              <h3>{lado.titulo}</h3>
              <span className="lado-total">
                {lado.alerta && (
                  <span className="qchip">
                    <IconeStatus status="atencao" />
                    {lado.alerta}
                  </span>
                )}
                {lado.total}
              </span>
            </div>
            <div className="lado-k">
              {lado.kpis.map((k) => (
                <Kpi key={k.rotulo} kpi={k} />
              ))}
            </div>
            <p className="lado-l">Idade dos títulos</p>
            <div className="aging-tiles">
              {lado.idade.map((f) => (
                <div
                  key={f.rotulo}
                  className={`at ${f.valor.valor === 0 ? 'zero' : f.status ? STATUS[f.status].classe : ''}`}
                >
                  <span>{f.rotulo}</span>
                  <b>{formatarValor(f.valor)}</b>
                  <em>{formatarPct(f.participacao)}</em>
                </div>
              ))}
            </div>
            {lado.observacao && (
              <p className="lado-obs">
                <Trechos trechos={lado.observacao} />
              </p>
            )}
            <p className="lado-l">Maiores saldos</p>
            <ul className="lado-maiores">
              {lado.maiores.map((m) => (
                <li key={m.nome}>
                  <span className="lado-nome">
                    {m.nome}
                    {m.etiqueta && <span className="tag">{m.etiqueta}</span>}
                  </span>
                  <b className="num">{formatarValor(m.valor)}</b>
                  <span className="num r-sub">{formatarPct(m.participacao)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </CaixaCartao>
  );
}
