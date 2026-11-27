import { useState } from 'react';
import { ApiErro, type FiltrosPainel } from '../../api/client';
import { useNomes } from '../../api/useNomes';
import { Chave } from '../../components/Chave';
import { Trechos } from '../../components/Trechos';
import type { CartaoTabela, TelaPainel } from '../../contracts/painel';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import { ConteudoCelula } from './Celula';
import { classeCelula } from './classeCelula';
import { useConsultaPainel } from './consultaPainel';
import { LinkParaTela } from './LinkParaTela';
import './TabelaCartao.css';

const ALINHAR = { esquerda: 'l', direita: '', centro: 'c' } as const;

type Tabela = Pick<CartaoTabela, 'colunas' | 'linhas' | 'variante'>;

/**
 * Tabela comprida (mais linhas que isto) num cartão que divide a linha com outro: rola por dentro,
 * com o cabeçalho fixo, para o cartão não ficar bem mais alto que o vizinho ("Quem cobrar hoje", com
 * até 20 clientes). No cartão de largura inteira, a tabela aparece toda.
 */
const LINHAS_SEM_ROLAR = 12;

/** Tabela com farol por célula e por linha (relatórios, atingimento mês a mês, linhas de produto). */
export function TabelaCartao({ cartao }: { cartao: CartaoTabela }) {
  const consulta = useConsultaPainel();
  // "Mostrar nomes" só quando a API manda a chave (perfil que pode ver dado nominal) e há consulta
  if (cartao.nomes && consulta)
    return <TabelaComNomes cartao={cartao} rotulo={cartao.nomes.rotulo} {...consulta} />;
  return (
    <CaixaCartao cartao={cartao} controle={cartao.link && <LinkParaTela link={cartao.link} />}>
      <Grade
        tabela={cartao}
        cartao={cartao}
        aviso={cartao.vazio ?? 'Nada para mostrar com esses filtros.'}
        limite={cartao.limite ?? undefined}
      />
      {cartao.rodape && cartao.rodape.length > 0 && (
        <p className="tbl-rodape">
          <Trechos trechos={cartao.rodape} />
        </p>
      )}
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
        <Grade tabela={cartao} cartao={cartao} aviso={aviso} soAviso={ligada} />
      </CaixaCartao>
    );
  }
  const nomes = consulta.data;
  return (
    <CaixaCartao cartao={{ ...cartao, subtitulo: nomes.subtitulo ?? cartao.subtitulo }} controle={chave}>
      <Grade
        tabela={{ ...nomes, variante: cartao.variante }}
        cartao={cartao}
        aviso={nomes.vazio ?? 'Nada para mostrar com esses filtros.'}
      />
    </CaixaCartao>
  );
}

interface PropsGrade {
  tabela: Tabela;
  // o cartão da tabela: a largura decide se ela rola, e o título dá nome à área de rolagem
  cartao: Pick<CartaoTabela, 'largura' | 'titulo'>;
  // texto da linha única quando não há linhas (ou, com soAviso, no lugar delas)
  aviso: string;
  soAviso?: boolean;
  // mostra só as primeiras linhas, com o botão para ver todas
  limite?: number;
}

type Linha = Tabela['linhas'][number];

/** Ordena pelo `ordem` da célula da coluna; célula sem `ordem` vai para o fim. */
function ordenar(linhas: Linha[], coluna: number, crescente: boolean): { linha: Linha; i: number }[] {
  const comIndice = linhas.map((linha, i) => ({ linha, i }));
  return comIndice.sort((a, b) => {
    const x = a.linha.celulas[coluna]?.ordem;
    const y = b.linha.celulas[coluna]?.ordem;
    if (x == null || y == null) return x == null ? (y == null ? a.i - b.i : 1) : -1;
    const d =
      typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR');
    return (crescente ? d : -d) || a.i - b.i;
  });
}

function Grade({ tabela, cartao, aviso, soAviso = false, limite }: PropsGrade) {
  const { colunas, variante = 'padrao' } = tabela;
  // a ordem escolhida no cabeçalho; sem ela, a ordem da API
  const [ordem, setOrdem] = useState<{ coluna: number; crescente: boolean } | null>(null);
  const [todas, setTodas] = useState(false);
  const ordenadas = ordem
    ? ordenar(tabela.linhas, ordem.coluna, ordem.crescente)
    : tabela.linhas.map((linha, i) => ({ linha, i }));
  const corta = limite != null && !soAviso && ordenadas.length > limite;
  const visiveis = corta && !todas ? ordenadas.slice(0, limite) : ordenadas;
  const linhas = visiveis.map((v) => v.linha);
  const rola = !soAviso && cartao.largura < 12 && linhas.length > LINHAS_SEM_ROLAR;
  // o primeiro clique: texto em ordem alfabética; número do maior para o menor
  const clicarColuna = (coluna: number) =>
    setOrdem((atual) =>
      atual?.coluna === coluna
        ? { coluna, crescente: !atual.crescente }
        : {
            coluna,
            crescente:
              typeof tabela.linhas.find((l) => l.celulas[coluna]?.ordem != null)?.celulas[coluna]?.ordem ===
              'string',
          },
    );
  // primeira coluna à esquerda; as outras, números à direita (ou o que a API pedir)
  const classeColuna = (i: number) => {
    const c = colunas[i];
    const alinhar = c?.alinhar ?? (i === 0 ? 'esquerda' : 'direita');
    return [ALINHAR[alinhar], c?.ocultarNoCelular ? 'so-largo' : ''].filter(Boolean).join(' ');
  };
  const classeLinha = (linha: Linha) =>
    [linha.status ? `rowcf-${STATUS[linha.status].classe}` : '', linha.separar ? 'sep' : '']
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <>
      <div
        className={`scroll-x${rola ? ' tbl-rola' : ''}`}
        // área de rolagem alcançável pelo teclado
        {...(rola && { tabIndex: 0, role: 'group', 'aria-label': `${cartao.titulo}: todas as linhas` })}
      >
        <table className={`tbl tbl-${variante}`}>
          <thead>
            <tr>
              {colunas.map((c, i) => (
                <th
                  key={i}
                  className={classeColuna(i)}
                  scope="col"
                  aria-sort={ordem?.coluna === i ? (ordem.crescente ? 'ascending' : 'descending') : undefined}
                >
                  {c.ordenavel ? (
                    <button type="button" className="tbl-ordena" onClick={() => clicarColuna(i)}>
                      {c.rotulo}
                      <span className="tbl-seta" aria-hidden="true">
                        {ordem?.coluna === i ? (ordem.crescente ? '↑' : '↓') : ''}
                      </span>
                    </button>
                  ) : (
                    c.rotulo
                  )}
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
              visiveis.map(({ linha, i }) => (
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
      {corta && (
        <button type="button" className="link tbl-mais" onClick={() => setTodas((t) => !t)}>
          {todas ? `Mostrar só as ${limite} primeiras` : `Ver todas as ${ordenadas.length}`}
        </button>
      )}
    </>
  );
}
