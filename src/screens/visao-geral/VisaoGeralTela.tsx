import { useEffect, useMemo, useState } from 'react';
import { useAdiantarMeses } from '../../api/adiantar';
import { semPermissao } from '../../api/client';
import { useSessao } from '../../api/useSessao';
import { useVisaoGeral } from '../../api/useVisaoGeral';
import { useAuth } from '../../auth/auth';
import { Assinatura } from '../../components/Assinatura';
import { BarraFiltros } from '../../components/BarraFiltros';
import { Cabecalho } from '../../components/Cabecalho';
import { EstadoTela } from '../../components/EstadoTela';
import { Simbolo } from '../../components/Marca';
import { formatarAtualizacao } from '../../format';
import { montarFiltros } from './filtros';
import { SecaoVisaoGeral } from './SecaoVisaoGeral';
import './VisaoGeral.css';

const TITULO = 'Visão geral';
const PERGUNTA = 'Como está a empresa hoje, área por área, contra o orçado e a meta?';

export function VisaoGeralTela() {
  const { sair } = useAuth();
  const sessao = useSessao();
  const filtros = useMemo(() => montarFiltros(sessao.data), [sessao.data]);
  // Só os chips que o usuário trocou; os outros ficam no padrão do FiltroDef.
  const [valores, setValores] = useState<Record<string, string>>({});
  // Na visão padrão não vai `mes`: é a mesma consulta adiantada ao entrar (adiantar.ts).
  const consultaFiltros = filtros.consulta(valores);
  const consulta = useVisaoGeral(consultaFiltros);
  useAdiantarMeses(
    consultaFiltros,
    sessao.data?.periodos ?? [],
    consulta.isSuccess && !consulta.isPlaceholderData && !consulta.isFetching,
  );

  useEffect(() => {
    document.title = `Overnex · ${TITULO}`;
  }, []);

  const dados = consulta.data;

  let conteudo;
  if (consulta.isPending) conteudo = <EstadoTela tipo="carregando" />;
  else if (consulta.isError)
    conteudo = semPermissao(consulta.error) ? (
      <EstadoTela tipo="sem-permissao" onSair={() => void sair()} />
    ) : (
      <EstadoTela tipo="erro" onTentarDeNovo={() => void consulta.refetch()} />
    );
  else if (consulta.data.secoes.length === 0) conteudo = <EstadoTela tipo="vazio" />;
  else
    conteudo = (
      <>
        <div className="vg-top">
          {consulta.data.nota && <span className="vg-note">{consulta.data.nota}</span>}
          {consulta.isPlaceholderData && (
            <span className="vg-carregando" role="status">
              <Simbolo className="vg-carregando-sym" />
              Carregando o período escolhido…
            </span>
          )}
        </div>
        {consulta.data.secoes.map((s) => (
          <SecaoVisaoGeral
            key={s.id}
            secao={s}
            periodos={consulta.data.periodos}
            empresa={consultaFiltros.empresa}
            // o "leitor" vê a escolha mas não muda (a API responderia 403)
            soLeitura={sessao.data?.papel === 'leitor'}
          />
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
