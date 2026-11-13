import { Link, useParams, useSearchParams } from 'react-router';
import { ApiErro, semPermissao } from '../../api/client';
import { useClienteGestao } from '../../api/useGestao';
import { Abas, PainelDaAba } from '../../components/Abas';
import { EstadoTela } from '../../components/EstadoTela';
import { Pill } from '../../components/Pill';
import type { ClienteGestaoPayload } from '../../contracts/gestao';
import { AbaAcesso } from './AbaAcesso';
import { AbaCargas, AbaDados } from './AbaDados';
import { AbaImplantacao } from './AbaImplantacao';
import { AbaPaineis } from './AbaPaineis';
import { AbaPreferencias } from './AbaPreferencias';
import { useTituloDaGestao } from './apoio';
import './EmpresaTela.css';

// Rótulos das abas, como no mockup Gestão M2.1.0. A última é "Horas e cargas" no mockup; ficou
// "Cargas" porque as horas de implantação não entram agora.
const ABAS = [
  { id: 'implantacao', rotulo: 'Implantação' },
  { id: 'dados', rotulo: 'Prontidão dos dados' },
  { id: 'paineis', rotulo: 'Painéis' },
  { id: 'preferencias', rotulo: 'Preferências da empresa' },
  { id: 'acesso', rotulo: 'Usuários e acesso' },
  { id: 'cargas', rotulo: 'Cargas' },
] as const;

type Aba = (typeof ABAS)[number]['id'];

const ID_ABAS = 'gestao-empresa';

/** Uma empresa na Gestão: o cabeçalho e as abas, com tudo de `GET /api/admin/clientes/{slug}`. */
export function EmpresaTela() {
  const { slug = '' } = useParams();
  const consulta = useClienteGestao(slug);
  const [params, setParams] = useSearchParams();
  const aba: Aba = ABAS.find((a) => a.id === params.get('aba'))?.id ?? ABAS[0].id;
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

  return (
    <>
      <header className="gst-topo">
        <div>
          <h1>{dados.cliente.nome}</h1>
          <p>
            <Link className="link" to={`/${dados.cliente.slug}`}>
              Abrir os painéis desta empresa
            </Link>
          </p>
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
      <Abas
        rotulo={`Configuração de ${dados.cliente.nome}`}
        idBase={ID_ABAS}
        abas={[...ABAS]}
        ativa={aba}
        // a aba fica na URL: recarregar ou trocar de empresa mantém a mesma
        onMudar={(id) => setParams(id === ABAS[0].id ? {} : { aba: id }, { replace: true })}
      />
      <PainelDaAba idBase={ID_ABAS} ativa={aba}>
        <ConteudoDaAba aba={aba} dados={dados} />
      </PainelDaAba>
    </>
  );
}

function ConteudoDaAba({ aba, dados }: { aba: Aba; dados: ClienteGestaoPayload }) {
  switch (aba) {
    case 'implantacao':
      return <AbaImplantacao camadas={dados.camadas} />;
    case 'dados':
      return <AbaDados fontes={dados.fontes} />;
    case 'paineis':
      return <AbaPaineis slug={dados.cliente.slug} paineis={dados.paineis} menu={dados.menu} />;
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
