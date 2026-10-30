import { useState } from 'react';
import { Grafico } from '../../charts/Grafico';
import { Segmentado } from '../../components/Segmentado';
import { Trechos } from '../../components/Trechos';
import type { CartaoGraficos } from '../../contracts/painel';
import { CaixaCartao } from './CaixaCartao';
import './GraficosCartao.css';

// em três colunas os gráficos são miniaturas (cada setor, mês a mês)
const ALTURA_EM_TRES = 160;

/** Um gráfico ou vários lado a lado, cada um com título e nota; com `visoes`, uma chave troca os gráficos. */
export function GraficosCartao({ cartao }: { cartao: CartaoGraficos }) {
  const { visoes = [] } = cartao;
  const [visaoEscolhida, setVisao] = useState<string | null>(null);
  const visao = visoes.find((v) => v.id === visaoEscolhida) ?? visoes[0];
  const graficos = visao ? visao.graficos : cartao.graficos;
  const varios = graficos.length > 1;
  const tres = cartao.colunas === 3;
  return (
    <CaixaCartao
      cartao={cartao}
      controle={
        visao &&
        visoes.length > 1 && (
          <Segmentado
            rotulo={cartao.rotuloVisoes ?? 'Visão'}
            opcoes={visoes.map((v) => ({ id: v.id, rotulo: v.rotulo }))}
            valor={visao.id}
            onMudar={setVisao}
          />
        )
      }
    >
      <div className={varios ? `sm-grid${tres ? ' tres' : ''}` : undefined}>
        {graficos.map((g, i) => (
          <div key={i} className="sm">
            {g.titulo && <h3>{g.titulo}</h3>}
            <Grafico
              grafico={g.grafico}
              aria={[cartao.titulo, visao?.rotulo, g.titulo].filter(Boolean).join(': ')}
              altura={tres ? ALTURA_EM_TRES : undefined}
            />
            {g.nota && <p className="note sm-nota">{g.nota}</p>}
          </div>
        ))}
      </div>
      {visao?.nota && (
        <p className="note">
          <Trechos trechos={visao.nota} />
        </p>
      )}
    </CaixaCartao>
  );
}
