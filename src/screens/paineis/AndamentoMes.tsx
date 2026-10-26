import { useState } from 'react';
import { Degraus } from '../../charts/Degraus';
import { Segmentado } from '../../components/Segmentado';
import type { CartaoAndamentoMes } from '../../contracts/painel';
import { formatarExibicao, formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './AndamentoMes.css';

/** Régua do mês, estatísticas do mês e o acumulado dia a dia, com uma visão por unidade. */
export function AndamentoMes({ cartao }: { cartao: CartaoAndamentoMes }) {
  const [visaoEscolhida, setVisao] = useState<string | null>(null);
  const visao = cartao.visoes.find((v) => v.id === visaoEscolhida) ?? cartao.visoes[0];
  return (
    <CaixaCartao
      cartao={cartao}
      controle={
        cartao.visoes.length > 1 &&
        visao && (
          <Segmentado
            rotulo="Unidade do gráfico"
            opcoes={cartao.visoes.map((v) => ({ id: v.id, rotulo: v.rotulo }))}
            valor={visao.id}
            onMudar={setVisao}
          />
        )
      }
    >
      <Regua regua={cartao.regua} />
      {cartao.estatisticas.length > 0 && (
        <div className="mstats">
          {cartao.estatisticas.map((e) => (
            <div key={e.rotulo} className={`ms${e.status ? ` cf-${STATUS[e.status].classe}` : ''}`}>
              <span>{e.rotulo}</span>
              <b>{formatarExibicao(e.valor, { comSinal: e.comSinal })}</b>
              {e.contexto && <em>{e.contexto}</em>}
            </div>
          ))}
        </div>
      )}
      {visao && <Degraus grafico={visao.grafico} aria={`${cartao.titulo}: ${visao.rotulo.toLowerCase()}`} />}
    </CaixaCartao>
  );
}

function Regua({ regua }: { regua: CartaoAndamentoMes['regua'] }) {
  // Escala da régua: um pouco além da maior marca (a supermeta), como no mockup.
  const fim = Math.max(...regua.trechos.map((t) => t.ate), ...regua.marcas.map((m) => m.valor), 1) * 1.045;
  const pos = (v: number) => `${(v / fim) * 100}%`;
  return (
    <div className="regua">
      <div
        className="rg-bar"
        role="img"
        aria-label={regua.trechos
          .map((t) => `${t.rotulo}: ${formatarValor(t.valor, { comSinal: t.comSinal })}`)
          .join('; ')}
      >
        {regua.trechos.map((t) => (
          <span
            key={t.estilo}
            className={`rg-${t.estilo}`}
            style={{ left: pos(t.de), width: pos(Math.max(0, t.ate - t.de)) }}
          />
        ))}
        {regua.marcas.map((m) => (
          <i key={m.rotulo} className={`rg-mk${m.secundaria ? ' sup' : ''}`} style={{ left: pos(m.valor) }}>
            <em>{m.rotulo}</em>
          </i>
        ))}
      </div>
      <div className="rg-legend">
        {regua.trechos.map((t) => (
          <span key={t.estilo}>
            <i className={t.estilo} aria-hidden="true" />
            {t.rotulo}{' '}
            <b className={t.estilo === 'falta' ? 't-crit' : undefined}>
              {formatarValor(t.valor, { comSinal: t.comSinal })}
            </b>
          </span>
        ))}
      </div>
    </div>
  );
}
