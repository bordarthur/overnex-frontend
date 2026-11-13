import { useState } from 'react';
import { ApiErro, type FiltrosPainel } from '../../api/client';
import { useNomes } from '../../api/useNomes';
import { Chave } from '../../components/Chave';
import type { CartaoTabela, TelaPainel } from '../../contracts/painel';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import { ConteudoCelula } from './Celula';
import { classeCelula } from './classeCelula';
import { useConsultaPainel } from './consultaPainel';
import './TabelaCartao.css';

const ALINHAR = { esquerda: 'l', direita: '', centro: 'c' } as const;

type Tabela = Pick<CartaoTabela, 'colunas' | 'linhas' | 'variante'>;

/** Tabela com farol por célula e por linha (relatórios, atingimento mês a mês, linhas de produto). */
export function TabelaCartao({ cartao }: { cartao: CartaoTabela }) {
  const consulta = useConsultaPainel();
  // "Mostrar nomes" só quando a API manda a chave (perfil que pode ver dado nominal) e há consulta
  if (cartao.nomes && consulta)
    return <TabelaComNomes cartao={cartao} rotulo={cartao.nomes.rotulo} {...consulta} />;
  return (
    <CaixaCartao cartao={cartao}>
      <Grade tabela={cartao} aviso={cartao.vazio ?? 'Nada para mostrar com esses filtros.'} />
    </CaixaCartao>
  );
}

interface PropsComNomes {
  cartao: CartaoTabela;
  rotulo: string;
  tela: TelaPainel;
  filtros: FiltrosPainel;
}

/** Com a chave ligada, a tabela agregada dá lugar à de uma linha por pessoa, pedida à parte. */
function TabelaComNomes({ cartao, rotulo, tela, filtros }: PropsComNomes) {
  const [ligada, setLigada] = useState(false);
  const { consulta, esquecer } = useNomes(tela, cartao.id, filtros, ligada);
  const mudar = (agora: boolean) => {
    setLigada(agora);
    if (!agora) esquecer();
  };
  const chave = <Chave rotulo={rotulo} ligada={ligada} onMudar={mudar} />;

  if (!ligada || !consulta.isSuccess) {
    const aviso = !ligada
      ? (cartao.vazio ?? 'Nada para mostrar com esses filtros.')
      : consulta.isError
        ? consulta.error instanceof ApiErro
          ? consulta.error.message
          : 'Não conseguimos carregar os nomes agora.'
        : 'Carregando os nomes…';
    return (
      <CaixaCartao cartao={cartao} controle={chave}>
        <Grade tabela={cartao} aviso={aviso} soAviso={ligada} />
      </CaixaCartao>
    );
  }
  const nomes = consulta.data;
  return (
    <CaixaCartao cartao={{ ...cartao, subtitulo: nomes.subtitulo ?? cartao.subtitulo }} controle={chave}>
      <Grade
        tabela={{ ...nomes, variante: cartao.variante }}
        aviso={nomes.vazio ?? 'Nada para mostrar com esses filtros.'}
      />
    </CaixaCartao>
  );
}

interface PropsGrade {
  tabela: Tabela;
  // texto da linha única quando não há linhas (ou, com soAviso, no lugar delas)
  aviso: string;
  soAviso?: boolean;
}

function Grade({ tabela, aviso, soAviso = false }: PropsGrade) {
  const { colunas, linhas, variante = 'padrao' } = tabela;
  // primeira coluna à esquerda; as outras, números à direita (ou o que a API pedir)
  const classeColuna = (i: number) => {
    const c = colunas[i];
    const alinhar = c?.alinhar ?? (i === 0 ? 'esquerda' : 'direita');
    return [ALINHAR[alinhar], c?.ocultarNoCelular ? 'so-largo' : ''].filter(Boolean).join(' ');
  };
  const classeLinha = (linha: Tabela['linhas'][number]) =>
    [linha.status ? `rowcf-${STATUS[linha.status].classe}` : '', linha.separar ? 'sep' : '']
      .filter(Boolean)
      .join(' ') || undefined;
  return (
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
          {soAviso || linhas.length === 0 ? (
            <tr>
              <td colSpan={colunas.length} className="l muted" role={soAviso ? 'status' : undefined}>
                {aviso}
              </td>
            </tr>
          ) : (
            linhas.map((linha, i) => (
              <tr key={i} className={classeLinha(linha)}>
                {linha.celulas.map((c, j) => (
                  <td key={j} className={[classeColuna(j), classeCelula(c)].filter(Boolean).join(' ')}>
                    <ConteudoCelula celula={c} curto={variante === 'tendencia'} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
