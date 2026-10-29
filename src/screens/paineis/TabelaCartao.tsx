import { Pill } from '../../components/Pill';
import type { CartaoTabela, Celula } from '../../contracts/painel';
import { formatarExibicao } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './TabelaCartao.css';

const ALINHAR = { esquerda: 'l', direita: '', centro: 'c' } as const;

/** Tabela com farol por célula e por linha (relatórios, atingimento mês a mês, linhas de produto). */
export function TabelaCartao({ cartao }: { cartao: CartaoTabela }) {
  const { colunas, linhas, variante = 'padrao' } = cartao;
  // primeira coluna à esquerda; as outras, números à direita (ou o que a API pedir)
  const classeColuna = (i: number) => {
    const c = colunas[i];
    const alinhar = c?.alinhar ?? (i === 0 ? 'esquerda' : 'direita');
    return [ALINHAR[alinhar], c?.ocultarNoCelular ? 'so-largo' : ''].filter(Boolean).join(' ');
  };
  return (
    <CaixaCartao cartao={cartao}>
      <div className="scroll-x">
        <table className={`tbl tbl-${variante}`}>
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
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={colunas.length} className="l muted">
                  {cartao.vazio ?? 'Nada para mostrar com esses filtros.'}
                </td>
              </tr>
            ) : (
              linhas.map((linha, i) => (
                <tr key={i} className={linha.status ? `rowcf-${STATUS[linha.status].classe}` : undefined}>
                  {linha.celulas.map((c, j) => (
                    <td key={j} className={[classeColuna(j), classeCelula(c)].filter(Boolean).join(' ')}>
                      <ConteudoCelula celula={c} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CaixaCartao>
  );
}

function classeCelula(c: Celula): string {
  const classes: string[] = [];
  if (c.fundo) classes.push(`cf-${STATUS[c.fundo].classe}`);
  if (c.tom) classes.push(c.tom === 'apagado' ? 'muted' : `t-${STATUS[c.tom].classe}`);
  if (c.negrito) classes.push('forte');
  return classes.join(' ');
}

function ConteudoCelula({ celula: c }: { celula: Celula }) {
  const numero = c.valor != null && typeof c.valor !== 'string' ? c.valor.valor : null;
  const seta = c.seta && numero ? (numero > 0 ? '▲ ' : '▼ ') : '';
  return (
    <>
      {c.valor != null && (
        <>
          {seta}
          {formatarExibicao(c.valor, { comSinal: c.comSinal })}
        </>
      )}
      {c.etiqueta && <span className="tagn">{c.etiqueta}</span>}
      {c.pill && (typeof c.pill === 'string' ? <Pill status={c.pill} /> : <Pill {...c.pill} />)}
      {c.sub && <span className="r-sub cel-sub">{c.sub}</span>}
    </>
  );
}
