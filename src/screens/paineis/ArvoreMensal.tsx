import { useMemo, useState } from 'react';
import { Segmentado } from '../../components/Segmentado';
import type { CartaoArvoreMensal } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { abertasAteNivel, linhasVisiveis, type Nivel } from './arvoreDre';
import { CaixaCartao } from './CaixaCartao';
import './DreCartao.css';
import './ArvoreMensal.css';

/**
 * Árvore de contas com uma coluna por mês (fluxo de caixa realizado): níveis e abrir e fechar cada
 * conta, como a DRE. Os números, os subtotais e o farol das células vêm prontos da API.
 */
export function ArvoreMensal({ cartao }: { cartao: CartaoArvoreMensal }) {
  const { linhas, escala, colunas } = cartao;
  const [nivel, setNivel] = useState<Nivel>(cartao.nivelInicial);
  const [abertas, setAbertas] = useState(() => abertasAteNivel(linhas, cartao.nivelInicial));
  const comFilhos = useMemo(() => new Set(linhas.map((l) => l.pai).filter(Boolean)), [linhas]);

  const escolherNivel = (n: Nivel) => {
    setNivel(n);
    setAbertas(abertasAteNivel(linhas, n));
  };
  const alternar = (id: string) =>
    setAbertas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  const numero = (v: number) =>
    formatarValor({ valor: v, unidade: escala.unidade, casas: escala.casas, sufixo: escala.sufixo });

  const controle =
    cartao.niveis.length > 1 ? (
      <div className="dre-tools">
        <Segmentado
          rotulo="Nível de detalhe"
          opcoes={cartao.niveis.map((n) => ({ id: String(n), rotulo: `Nível ${n}` }))}
          valor={String(nivel)}
          onMudar={(n) => escolherNivel(Number(n) as Nivel)}
        />
      </div>
    ) : undefined;

  return (
    <CaixaCartao cartao={cartao} controle={controle}>
      <div className="scroll-x">
        <table className="tbl dre arvore-mensal">
          <thead>
            <tr>
              <th className="l" scope="col">
                {cartao.rotuloConta}
              </th>
              {colunas.map((c, i) => (
                <th key={i} scope="col" title={c.titulo} className={c.total ? 'am-total' : undefined}>
                  {c.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhasVisiveis(linhas, abertas).map((l) => {
              const aberta = abertas.has(l.id);
              const classe =
                l.nivel === 0 ? `sub${l.final ? ' final' : ''}` : `n${l.nivel}${aberta ? ' open' : ''}`;
              return (
                <tr key={l.id} className={classe}>
                  <td className="l" style={{ paddingLeft: l.nivel === 0 ? 10 : (l.nivel - 1) * 18 }}>
                    {l.nivel === 0 ? (
                      l.nome
                    ) : comFilhos.has(l.id) ? (
                      <button
                        type="button"
                        className="acc"
                        aria-expanded={aberta}
                        onClick={() => alternar(l.id)}
                      >
                        <Seta />
                        {l.nome}
                      </button>
                    ) : (
                      <>
                        <span className="dre-recuo" />
                        {l.nome}
                      </>
                    )}
                  </td>
                  {colunas.map((c, i) => {
                    const v = l.valores[i];
                    const fundo = l.fundos?.[i];
                    const classes = [c.total ? 'am-total' : '', fundo ? `cfl-${STATUS[fundo].classe}` : '']
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <td key={i} className={classes || undefined}>
                        {v == null ? '' : numero(v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {cartao.rodape && cartao.rodape.length > 0 && (
        <div className="dre-foot">
          {cartao.rodape.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      )}
    </CaixaCartao>
  );
}

function Seta() {
  return (
    <span className="caret" aria-hidden="true">
      <svg viewBox="0 0 10 10">
        <path
          d="M3 1.5L7 5 3 8.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
