import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { semPermissao } from '../../api/client';
import { useSessao } from '../../api/useSessao';
import { useVisaoGeral } from '../../api/useVisaoGeral';
import { Assinatura } from '../../components/Assinatura';
import { BarraFiltros } from '../../components/BarraFiltros';
import { Cabecalho } from '../../components/Cabecalho';
import { EstadoTela } from '../../components/EstadoTela';
import { Segmentado } from '../../components/Segmentado';
import type { PeriodoId } from '../../contracts/visaoGeral';
import { formatarAtualizacao } from '../../format';
import { montarFiltros } from './filtros';
import { SecaoVisaoGeral } from './SecaoVisaoGeral';
import './VisaoGeral.css';

const TITULO = 'Visão geral';
const PERGUNTA = 'Como está a empresa hoje, área por área, contra o orçado e a meta?';

export function VisaoGeralTela() {
  const { clienteSlug = '' } = useParams();
  const sessao = useSessao();
  const filtros = useMemo(() => montarFiltros(sessao.data), [sessao.data]);
  // Só os chips que o usuário trocou; os outros ficam no padrão do FiltroDef.
  const [valores, setValores] = useState<Record<string, string>>({});
  const consulta = useVisaoGeral(clienteSlug, filtros.consulta(valores));
  const [periodoEscolhido, setPeriodo] = useState<PeriodoId | null>(null);

  useEffect(() => {
    document.title = `Overnex · ${TITULO}`;
  }, []);

  const dados = consulta.data;
  const periodo = periodoEscolhido ?? dados?.periodos[0]?.id ?? 'mes';

  let conteudo;
  if (consulta.isPending) conteudo = <EstadoTela tipo="carregando" />;
  else if (consulta.isError)
    conteudo = semPermissao(consulta.error) ? (
      <EstadoTela tipo="sem-permissao" />
    ) : (
      <EstadoTela tipo="erro" onTentarDeNovo={() => void consulta.refetch()} />
    );
  else if (consulta.data.secoes.length === 0) conteudo = <EstadoTela tipo="vazio" />;
  else
    conteudo = (
      <>
        <div className="vg-top">
          <Segmentado
            rotulo="Período da visão geral"
            opcoes={consulta.data.periodos}
            valor={periodo}
            onMudar={setPeriodo}
          />
        </div>
        {consulta.data.secoes.map((s) => (
          <SecaoVisaoGeral key={s.id} secao={s} periodo={periodo} />
        ))}
      </>
    );

  return (
    <>
      <Cabecalho
        titulo={TITULO}
        pergunta={PERGUNTA}
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
      <section className="panel" aria-label={TITULO} aria-busy={consulta.isPlaceholderData}>
        {conteudo}
        {dados && <Assinatura atualizadoEm={dados.atualizadoEm} />}
      </section>
    </>
  );
}
