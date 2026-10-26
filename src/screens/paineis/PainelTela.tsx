import { useEffect, useMemo, useState } from 'react';
import { semPermissao } from '../../api/client';
import { usePainel } from '../../api/usePainel';
import { useSessao } from '../../api/useSessao';
import { useAuth } from '../../auth/auth';
import { Assinatura } from '../../components/Assinatura';
import { Aviso } from '../../components/Aviso';
import { BarraFiltros } from '../../components/BarraFiltros';
import { Cabecalho } from '../../components/Cabecalho';
import { Apoios, Destaques } from '../../components/Destaques';
import { EstadoTela } from '../../components/EstadoTela';
import { LinhaKpis } from '../../components/Kpi';
import { Simbolo } from '../../components/Marca';
import type { FiltroPainel, TelaPainel } from '../../contracts/painel';
import { formatarAtualizacao } from '../../format';
import { montarFiltros } from '../visao-geral/filtros';
import { CartaoPainel } from './CartaoPainel';
import { juntarFiltros } from './filtrosPainel';
import { TELAS_COMERCIAIS } from './telas';
import './PainelTela.css';

const SEM_FILTROS: FiltroPainel[] = [];

/**
 * Tela de painel por cartões (Vendas, Equipe comercial, Clientes). Desenha só o que veio no
 * payload, na ordem em que veio. Use com `key={tela}` para os filtros não passarem de uma tela a outra.
 */
export function PainelTela({ tela }: { tela: TelaPainel }) {
  const { titulo, pergunta } = TELAS_COMERCIAIS[tela];
  const { sair } = useAuth();
  const sessao = useSessao();
  // Só os chips que o usuário trocou; os outros ficam no padrão.
  const [valores, setValores] = useState<Record<string, string>>({});
  // Os filtros próprios da tela chegam com o payload; antes dele, ficam só os da sessão. Na troca
  // de filtro o payload anterior continua (placeholder), então os chips não somem.
  const [filtrosDaTela, setFiltrosDaTela] = useState<FiltroPainel[]>(SEM_FILTROS);
  const filtros = useMemo(
    () => juntarFiltros(montarFiltros(sessao.data), filtrosDaTela),
    [sessao.data, filtrosDaTela],
  );
  const consulta = usePainel(tela, filtros.consulta(valores));
  const dados = consulta.data;
  // Ajuste durante a renderização (padrão do React para estado derivado de props), sem efeito.
  if (dados && dados.filtros !== filtrosDaTela) setFiltrosDaTela(dados.filtros);

  useEffect(() => {
    document.title = `Overnex · ${titulo}`;
  }, [titulo]);

  let conteudo;
  if (consulta.isPending) conteudo = <EstadoTela tipo="carregando" />;
  else if (consulta.isError)
    conteudo = semPermissao(consulta.error) ? (
      <EstadoTela tipo="sem-permissao" onSair={() => void sair()} />
    ) : (
      <EstadoTela tipo="erro" onTentarDeNovo={() => void consulta.refetch()} />
    );
  else {
    const d = consulta.data;
    const vazio = d.cartoes.length === 0 && d.destaques.length === 0 && d.kpis.length === 0;
    conteudo = vazio ? (
      <EstadoTela tipo="vazio" />
    ) : (
      <>
        {consulta.isPlaceholderData && (
          <span className="painel-carregando" role="status">
            <Simbolo className="painel-carregando-sym" />
            Carregando os filtros escolhidos…
          </span>
        )}
        {d.aviso && <Aviso aviso={d.aviso} />}
        {d.destaques.length > 0 && <Destaques itens={d.destaques} />}
        {d.kpis.length > 0 && <LinhaKpis kpis={d.kpis} />}
        {d.apoios.length > 0 ? <Apoios itens={d.apoios} /> : <div className="painel-espaco" />}
        <div className="grid">
          {d.cartoes.map((c) => (
            <CartaoPainel key={c.id} cartao={c} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Cabecalho
        titulo={titulo}
        pergunta={pergunta}
        atualizacao={
          dados?.dadosAte && dados.atualizadoEm
            ? formatarAtualizacao(dados.dadosAte, dados.atualizadoEm)
            : undefined
        }
        cliente={dados?.cliente}
      />
      <BarraFiltros
        filtros={filtros.defs}
        valores={valores}
        onMudar={(id, valor) => setValores((atual) => ({ ...atual, [id]: valor }))}
        onLimpar={() => setValores({})}
      />
      {/* Com o filtro trocado, os números anteriores ficam esmaecidos até os novos chegarem. */}
      <section className="panel" aria-label={titulo} aria-busy={consulta.isPlaceholderData}>
        {conteudo}
        {dados && <Assinatura atualizadoEm={dados.atualizadoEm} />}
      </section>
    </>
  );
}
