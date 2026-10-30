import { useMemo, useState } from 'react';
import { Faisca } from '../../charts/Faisca';
import { Pill } from '../../components/Pill';
import { Segmentado } from '../../components/Segmentado';
import type { CartaoDre } from '../../contracts/painel';
import { formatarPct, formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { abertasAteNivel, linhasVisiveis, type Nivel } from './arvoreDre';
import { CaixaCartao } from './CaixaCartao';
import './DreCartao.css';

/** DRE gerencial em árvore: níveis, abrir e fechar cada conta, "Só desvios" e a tendência de 6 meses. */
export function DreCartao({ cartao }: { cartao: CartaoDre }) {
  const { linhas, escala } = cartao;
  const [nivel, setNivel] = useState<Nivel>(cartao.nivelInicial);
  const [abertas, setAbertas] = useState(() => abertasAteNivel(linhas, cartao.nivelInicial));
  const [soDesvios, setSoDesvios] = useState(false);
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
  const numero = (v: number, comSinal = false) =>
    formatarValor(
      { valor: v, unidade: escala.unidade, casas: escala.casas, sufixo: escala.sufixo },
      { comSinal },
    );
  const maiorNivel = Math.max(...cartao.niveis) as Nivel;

  const controle = (
    <div className="dre-tools">
      {cartao.niveis.length > 1 && (
        <Segmentado
          rotulo="Nível de detalhe"
          opcoes={cartao.niveis.map((n) => ({ id: String(n), rotulo: `Nível ${n}` }))}
          valor={String(nivel)}
          onMudar={(n) => escolherNivel(Number(n) as Nivel)}
        />
      )}
      <button
        type="button"
        className="tgl"
        aria-pressed={soDesvios}
        onClick={() => {
          // como no mockup: ao ligar, abre tudo para mostrar onde está cada desvio
          if (!soDesvios) escolherNivel(maiorNivel);
          setSoDesvios(!soDesvios);
        }}
      >
        <span className="sw" aria-hidden="true" />
        Só desvios
      </button>
    </div>
  );

  return (
    <CaixaCartao cartao={cartao} controle={controle}>
      <div className="scroll-x">
        <table className="tbl dre">
          <thead>
            <tr>
              <th className="l" scope="col">
                {cartao.rotuloConta}
              </th>
              <th scope="col">Realizado</th>
              <th scope="col">% receita bruta</th>
              <th scope="col">{cartao.rotuloComparacao}</th>
              <th scope="col">Diferença</th>
              <th scope="col">Dif. %</th>
              <th className="l" scope="col">
                Farol
              </th>
              <th scope="col">
                6 meses{' '}
                <span className="muted dre-th-nota">· - - {cartao.rotuloComparacao.toLowerCase()}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {linhasVisiveis(linhas, abertas, soDesvios).map((l) => {
              const aberta = abertas.has(l.id);
              const temFilhos = comFilhos.has(l.id);
              const classe =
                l.nivel === 0 ? `sub${l.final ? ' final' : ''}` : `n${l.nivel}${aberta ? ' open' : ''}`;
              const tom = l.tomDiferenca ? STATUS[l.tomDiferenca].classe : null;
              const fundo = l.destacarDiferenca && tom ? ` cfl-${tom}` : '';
              return (
                <tr key={l.id} className={classe}>
                  <td className="l" style={{ paddingLeft: l.nivel === 0 ? 10 : (l.nivel - 1) * 20 }}>
                    {l.nivel === 0 ? (
                      l.nome
                    ) : temFilhos ? (
                      <button
                        type="button"
                        className="acc"
                        aria-expanded={aberta}
                        onClick={() => alternar(l.id)}
                      >
                        <Seta />
                        {l.codigo && <span className="code">{l.codigo}</span>}
                        {l.nome}
                      </button>
                    ) : (
                      <>
                        <span className="dre-recuo" />
                        {l.codigo && <span className="code">{l.codigo}</span>}
                        {l.nome}
                      </>
                    )}
                  </td>
                  <td>{numero(l.realizado)}</td>
                  <td className="muted">{formatarPct(l.percentualReceitaBruta)}</td>
                  <td>{numero(l.comparacao)}</td>
                  <td className={`${tom ? `t-${tom}` : ''}${fundo}`}>{numero(l.diferenca, true)}</td>
                  <td className={l.destacarDiferenca && tom ? `t-${tom}${fundo}` : 'muted'}>
                    {l.diferencaPercentual == null
                      ? '–'
                      : formatarValor({ valor: l.diferencaPercentual, unidade: 'pct' }, { comSinal: true })}
                  </td>
                  <td className="l">
                    <Pill status={l.status} />
                  </td>
                  <td>
                    <Faisca realizado={l.tendencia.realizado} comparacao={l.tendencia.comparacao} />
                  </td>
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
