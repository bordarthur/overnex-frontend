import { BarraIdade } from '../../components/BarraIdade';
import { Kpi } from '../../components/Kpi';
import { IconeStatus } from '../../components/Pill';
import { Trechos } from '../../components/Trechos';
import type { CartaoDoisLados } from '../../contracts/painel';
import { formatarPct, formatarValor } from '../../format';
import { CaixaCartao } from './CaixaCartao';
import './DoisLados.css';

/**
 * Duas metades lado a lado (contas a receber × a pagar): KPIs, idade dos títulos (a barra com fitas
 * até os quadros, como na inadimplência da Visão geral) e maiores saldos.
 */
export function DoisLados({ cartao }: { cartao: CartaoDoisLados }) {
  return (
    // cada lado já tem o próprio título: o do cartão fica só para o leitor de tela
    <CaixaCartao cartao={cartao} semCabecalho>
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
            <BarraIdade
              faixas={lado.idade.map((f) => ({ ...f, percentual: f.participacao }))}
              sufixo={lado.rotuloParticipacao}
              aria={`${lado.titulo} por idade dos títulos`}
            />
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
