import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { semPermissao } from '../../api/client';
import { useVisaoGeral } from '../../api/useVisaoGeral';
import { Assinatura } from '../../components/Assinatura';
import { BarraFiltros } from '../../components/BarraFiltros';
import { Cabecalho } from '../../components/Cabecalho';
import { EstadoTela } from '../../components/EstadoTela';
import { Segmentado } from '../../components/Segmentado';
import type { PeriodoId } from '../../contracts/visaoGeral';
import { formatarAtualizacao } from '../../format';
import { FILTROS_GLOBAIS, valoresPadrao } from './filtrosDemo';
import { SecaoVisaoGeral } from './SecaoVisaoGeral';
import './VisaoGeral.css';

const TITULO = 'Visão geral';
const PERGUNTA = 'Como está a empresa hoje, área por área, contra o orçado e a meta?';

export function VisaoGeralTela() {
  const { clienteSlug = '' } = useParams();
  const consulta = useVisaoGeral(clienteSlug);
  const [periodoEscolhido, setPeriodo] = useState<PeriodoId | null>(null);
  const [filtros, setFiltros] = useState(valoresPadrao);

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
        filtros={FILTROS_GLOBAIS}
        valores={filtros}
        onMudar={(id, valor) => setFiltros((atual) => ({ ...atual, [id]: valor }))}
        onLimpar={() => setFiltros(valoresPadrao())}
      />
      <section className="panel" aria-label={TITULO}>
        {conteudo}
        {dados && <Assinatura atualizadoEm={dados.atualizadoEm} />}
      </section>
    </>
  );
}
