import { useState } from 'react';
import { Faisca } from '../../charts/Faisca';
import { Linhas } from '../../charts/Linhas';
import type { CartaoListaDetalhe } from '../../contracts/painel';
import { formatarExibicao } from '../../format';
import { CaixaCartao } from './CaixaCartao';
import { ConteudoCelula } from './Celula';
import { classeCelula } from './classeCelula';
import './TabelaCartao.css';
import './ListaDetalhe.css';

const ALINHAR = { esquerda: 'l', direita: '', centro: 'c' } as const;

/** Lista em que cada linha abre o próprio gráfico ao lado (produtividade por setor). */
export function ListaDetalhe({ cartao }: { cartao: CartaoListaDetalhe }) {
  const { colunas, itens } = cartao;
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const atual = itens.find((it) => it.id === escolhido) ?? itens[0];
  const classeColuna = (i: number) => {
    const c = colunas[i];
    const alinhar = c?.alinhar ?? (i === 0 ? 'esquerda' : 'direita');
    return [ALINHAR[alinhar], c?.ocultarNoCelular ? 'so-largo' : ''].filter(Boolean).join(' ');
  };
  // a última coluna é a da tendência
  const colTendencia = colunas.length - 1;
  return (
    <CaixaCartao cartao={cartao}>
      <div className="duo">
        <div className="scroll-x">
          <table className="tbl tbl-compacta lista-detalhe">
            <thead>
              <tr>
                {colunas.map((c, i) => (
                  <th key={i} className={classeColuna(i)} scope="col">
                    {c.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((it) => {
                const [primeira, ...outras] = it.celulas;
                const marcado = it.id === atual?.id;
                return (
                  // o botão da primeira célula é o que vale no teclado; o clique na linha é atalho
                  <tr
                    key={it.id}
                    className={marcado ? 'prow cur' : 'prow'}
                    onClick={() => setEscolhido(it.id)}
                  >
                    <th
                      scope="row"
                      className={[classeColuna(0), primeira ? classeCelula(primeira) : ''].join(' ')}
                    >
                      <button type="button" className="prow-btn" aria-pressed={marcado}>
                        {primeira?.valor != null ? formatarExibicao(primeira.valor) : ''}
                      </button>
                    </th>
                    {outras.map((c, j) => (
                      <td
                        key={j}
                        className={[classeColuna(j + 1), classeCelula(c)].filter(Boolean).join(' ')}
                      >
                        <ConteudoCelula celula={c} />
                      </td>
                    ))}
                    <td className={classeColuna(colTendencia)}>
                      <Faisca
                        realizado={it.tendencia.realizado}
                        comparacao={it.tendencia.comparacao}
                        w={90}
                        h={24}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {atual && (
          <div className="duo-detalhe">
            <h3>{atual.detalhe.titulo}</h3>
            <Linhas grafico={atual.detalhe.grafico} aria={atual.detalhe.titulo} altura={210} />
          </div>
        )}
      </div>
    </CaixaCartao>
  );
}
