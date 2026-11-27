import { Link, useParams, useSearchParams } from 'react-router';
import { ApiErro, semPermissao } from '../../api/client';
import { useClienteGestao } from '../../api/useGestao';
import { Abas, PainelDaAba } from '../../components/Abas';
import { EstadoTela } from '../../components/EstadoTela';
import { Pill } from '../../components/Pill';
import type { ClienteGestaoPayload, IdAbaEmpresa } from '../../contracts/gestao';
import { AbaAcesso } from './AbaAcesso';
import { AbaCargas, AbaDados } from './AbaDados';
import { AbaImplantacao } from './AbaImplantacao';
import { AbaPaineis } from './AbaPaineis';
import { AbaPreferencias } from './AbaPreferencias';
import { AbaUnidades } from './AbaUnidades';
import { useTituloDaGestao } from './apoio';
import { ConvidarUsuario } from './ConvidarUsuario';
import { EditarEmpresa } from './EditarEmpresa';
import './EmpresaTela.css';

const ID_ABAS = 'gestao-empresa';

/**
 * Uma empresa na Gestão: o cabeçalho e as abas, com tudo de `GET /api/admin/clientes/{slug}`. As abas
 * (e os rótulos) e os botões do cabeçalho vêm da API, em `abas` e `permissoes`.
 */
export function EmpresaTela() {
  const { slug = '' } = useParams();
  const consulta = useClienteGestao(slug);
  const [params, setParams] = useSearchParams();
  useTituloDaGestao(consulta.data?.cliente.nome ?? 'Empresas');

  if (consulta.isPending) return <EstadoTela tipo="carregando" />;
  if (consulta.isError) {
    // "Empresa não encontrada.": o texto que a API mandou
    if (consulta.error instanceof ApiErro && consulta.error.status === 404)
      return <EstadoTela tipo="vazio" texto={consulta.error.message} />;
    return semPermissao(consulta.error) ? (
      <EstadoTela tipo="sem-permissao" />
    ) : (
      <EstadoTela tipo="erro" onTentarDeNovo={() => void consulta.refetch()} />
    );
  }
  const dados = consulta.data;
  // `?aba=` com uma aba que a pessoa não vê cai na primeira
  const primeira = dados.abas[0]?.id;
  const aba = dados.abas.find((a) => a.id === params.get('aba'))?.id ?? primeira;

  return (
    <>
      <header className="gst-topo">
        <div>
          <h1>{dados.cliente.nome}</h1>
          {dados.cliente.setores.length > 0 && (
            <p>{dados.cliente.setores.map((s) => s.rotulo).join(' · ')}</p>
          )}
          <div className="gst-acoes">
            <Link className="btn gst-botao" to={`/${dados.cliente.slug}`}>
              Abrir os painéis desta empresa
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            {dados.permissoes.convidar && <ConvidarUsuario empresa={dados.cliente.slug} secundario />}
            {dados.permissoes.editar && <EditarEmpresa cliente={dados.cliente} />}
          </div>
        </div>
        <div className="gst-chips">
          {dados.resumo.map((c) => (
            <Pill key={c.rotulo} status={c.status} rotulo={c.rotulo} />
          ))}
        </div>
      </header>
      <div className="gst-faixa" role="note">
        <b>Configuração, não personalização.</b> Aqui se liga ou desliga <b>painéis</b> do catálogo fechado.
        Dentro de cada painel, o gráfico sem dado no DW some sozinho no front. <b>Universal Básico</b> sobe só
        com as tabelas do ERP; <b>Universal Completo</b> exige plano de contas, De-Para, orçamento e
        saldo-âncora.
      </div>
      {aba && (
        <>
          <Abas
            rotulo={`Configuração de ${dados.cliente.nome}`}
            idBase={ID_ABAS}
            abas={dados.abas}
            ativa={aba}
            // a aba fica na URL: recarregar ou trocar de empresa mantém a mesma
            onMudar={(id) => setParams(id === primeira ? {} : { aba: id }, { replace: true })}
          />
          <PainelDaAba idBase={ID_ABAS} ativa={aba}>
            <ConteudoDaAba aba={aba} dados={dados} />
          </PainelDaAba>
        </>
      )}
    </>
  );
}

function ConteudoDaAba({ aba, dados }: { aba: IdAbaEmpresa; dados: ClienteGestaoPayload }) {
  switch (aba) {
    case 'implantacao':
      return <AbaImplantacao camadas={dados.camadas} niveis={dados.niveis} />;
    case 'unidades':
      return (
        <AbaUnidades
          slug={dados.cliente.slug}
          unidades={dados.unidades}
          podeEditar={dados.permissoes.unidades ?? false}
          setores={dados.opcoesSetor ?? []}
        />
      );
    case 'dados':
      return <AbaDados fontes={dados.fontes} />;
    case 'paineis':
      return (
        <AbaPaineis
          slug={dados.cliente.slug}
          paineis={dados.paineis}
          menu={dados.menu}
          niveis={dados.niveis}
        />
      );
    case 'preferencias':
      return (
        <AbaPreferencias
          slug={dados.cliente.slug}
          preferencias={dados.preferencias}
          feriados={dados.feriados}
        />
      );
    case 'acesso':
      return <AbaAcesso cliente={dados.cliente} usuarios={dados.usuarios} acesso={dados.acesso} />;
    case 'cargas':
      return <AbaCargas cargas={dados.cargas} />;
  }
}
