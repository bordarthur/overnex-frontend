import { useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useMatch, useSearchParams } from 'react-router';
import { semPermissao, useApiClient } from '../../api/client';
import { useGestao, useUsuariosGestao } from '../../api/useGestao';
import { useSessao } from '../../api/useSessao';
import { TelaSolta } from '../../app/Guardas';
import { useTopoAoTrocarDeTela } from '../../app/topo';
import { useAuth } from '../../auth/auth';
import { CampoBusca } from '../../components/CampoBusca';
import { EstadoTela } from '../../components/EstadoTela';
import { Logotipo } from '../../components/Marca';
import type { ClienteDaLista, FiltroUsuarios } from '../../contracts/gestao';
import { semAcento } from '../../format';
import { ROTULO_TEMA } from '../../theme/tema';
import { useTema } from '../../theme/useTema';
import { FILTRO_TODOS } from './apoio';
// as tabelas da Gestão usam as classes .tbl e .scroll-x dos painéis
import '../paineis/TabelaCartao.css';
import './GestaoMoldura.css';

/**
 * Gestão (Interno BORD): só para quem a sessão diz `gestao: true` (o Admin BORD). Para os outros,
 * "sem acesso"; e a API recusa as rotas /api/admin/* do mesmo jeito.
 */
export function GestaoMoldura() {
  const sessao = useSessao();
  const { sair } = useAuth();

  if (sessao.isPending)
    return (
      <TelaSolta>
        <EstadoTela tipo="carregando" />
      </TelaSolta>
    );
  if (sessao.isError && !semPermissao(sessao.error))
    return (
      <TelaSolta>
        <EstadoTela tipo="erro" onTentarDeNovo={() => void sessao.refetch()} />
      </TelaSolta>
    );
  if (sessao.isError || !sessao.data.gestao)
    return (
      <TelaSolta>
        <EstadoTela tipo="sem-permissao" onSair={() => void sair()} />
      </TelaSolta>
    );
  return <Dentro />;
}

function Dentro() {
  const { dadosFicticios } = useApiClient();
  const { usuario, sair } = useAuth();
  const { modo, alternar } = useTema();
  const gestao = useGestao();
  const usuarios = useUsuariosGestao();
  const emUsuarios = useMatch('/gestao/usuarios') !== null;
  const empresaAberta = useMatch('/gestao/empresas/:slug')?.params.slug;
  // Voltar de Usuários para Empresas reabre a empresa em que a pessoa estava.
  const [ultimaEmpresa, setUltimaEmpresa] = useState(empresaAberta);
  if (empresaAberta && empresaAberta !== ultimaEmpresa) setUltimaEmpresa(empresaAberta);
  useTopoAoTrocarDeTela();

  const clientes = gestao.data?.clientes;
  const totalPessoas = usuarios.data?.filtros.find((f) => f.id === FILTRO_TODOS)?.total;
  const camadas = clientes?.[0]?.camadas.map((k) => k.rotulo).join(', ');

  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="gst">
        <aside className="gst-lado" aria-label="Gestão">
          <div className="gst-marca">
            <Logotipo className="gst-logo" rotulo="Overnex" />
            <span className="gst-selo">Interno BORD</span>
          </div>
          <nav className="gst-modos" aria-label="Área da gestão">
            <Link
              to={ultimaEmpresa ? `/gestao/empresas/${ultimaEmpresa}` : '/gestao/empresas'}
              aria-current={emUsuarios ? undefined : 'page'}
            >
              Empresas{clientes && <em>{clientes.length}</em>}
            </Link>
            <Link to="/gestao/usuarios" aria-current={emUsuarios ? 'page' : undefined}>
              Usuários{totalPessoas !== undefined && <em>{totalPessoas}</em>}
            </Link>
          </nav>
          {emUsuarios ? (
            <ListaFiltros filtros={usuarios.data?.filtros} />
          ) : (
            <ListaEmpresas clientes={clientes} aberta={empresaAberta} />
          )}
          <div className="gst-pe">
            {!emUsuarios && camadas && <p>Camadas na barra: {camadas}.</p>}
            {dadosFicticios && <span>Dados fictícios</span>}
            <button className="gst-tema" type="button" onClick={alternar}>
              Tema: {ROTULO_TEMA[modo]}
            </button>
            <div className="gst-conta">
              {usuario && (
                <div className="gst-quem">
                  <span>{usuario.nome ?? usuario.email}</span>
                  {usuario.nome && <span className="gst-email">{usuario.email}</span>}
                </div>
              )}
              <button className="link gst-sair" type="button" onClick={() => void sair()}>
                Sair
              </button>
            </div>
          </div>
        </aside>
        <main className="gst-main" id="conteudo" tabIndex={-1}>
          {gestao.isError ? (
            <EstadoTela
              tipo={semPermissao(gestao.error) ? 'sem-permissao' : 'erro'}
              onTentarDeNovo={() => void gestao.refetch()}
              onSair={() => void sair()}
            />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </>
  );
}

/** "/gestao" e "/gestao/empresas": abre a primeira empresa da lista. */
export function PrimeiraEmpresa() {
  const gestao = useGestao();
  const primeira = gestao.data?.clientes[0];

  if (gestao.isPending) return <EstadoTela tipo="carregando" />;
  if (!primeira) return <EstadoTela tipo="vazio" texto="Ainda não há empresa cadastrada no DW." />;
  return <Navigate to={`/gestao/empresas/${primeira.slug}`} replace />;
}

function ListaEmpresas({ clientes, aberta }: { clientes?: ClienteDaLista[]; aberta?: string }) {
  const [busca, setBusca] = useState('');
  // trocar de empresa mantém a aba aberta (`?aba=`)
  const { search } = useLocation();
  const termo = semAcento(busca.trim());
  const lista = clientes?.filter((c) => !termo || semAcento(c.nome).includes(termo));

  return (
    <div className="gst-bloco">
      <CampoBusca rotulo="Buscar empresa" valor={busca} onMudar={setBusca} variante="escura" />
      <nav className="gst-lista" aria-label="Empresas">
        {lista?.map((c) => (
          <Link
            key={c.slug}
            className="gst-item"
            to={{ pathname: `/gestao/empresas/${c.slug}`, search }}
            aria-current={c.slug === aberta ? 'page' : undefined}
          >
            <b>{c.nome}</b>
            {/* uma barrinha por camada; o texto fica na dica e para o leitor de tela */}
            <span className="gst-pontos" aria-hidden="true">
              {c.camadas.map((k) => (
                <i
                  key={k.id}
                  className={`gst-ponto p-${k.status}`}
                  title={`${k.rotulo}: ${k.estadoRotulo}`}
                />
              ))}
            </span>
            <span className="visualmente-oculto">
              {c.camadas.map((k) => `${k.rotulo}: ${k.estadoRotulo}`).join('; ')}
            </span>
          </Link>
        ))}
        {lista?.length === 0 && <p className="gst-nota-lado">Nenhuma empresa com esse nome.</p>}
      </nav>
      <p className="gst-nota-lado">As empresas vêm do DW. Aqui não se cadastra empresa.</p>
    </div>
  );
}

function ListaFiltros({ filtros }: { filtros?: FiltroUsuarios[] }) {
  const [params] = useSearchParams();
  const ativo = params.get('filtro') ?? FILTRO_TODOS;
  const primeiroDeAtencao = filtros?.find((f) => f.atencao)?.id;

  return (
    <nav className="gst-lista gst-bloco" aria-label="Filtros de pessoas">
      {filtros?.map((f) => (
        <FiltroDaLista key={f.id} filtro={f} ativo={f.id === ativo} titulo={f.id === primeiroDeAtencao} />
      ))}
    </nav>
  );
}

function FiltroDaLista({
  filtro,
  ativo,
  titulo,
}: {
  filtro: FiltroUsuarios;
  ativo: boolean;
  titulo: boolean;
}) {
  return (
    <>
      {titulo && <p className="gst-nota-lado gst-atencao">Pedem atenção</p>}
      <Link
        className="gst-item gst-item-linha"
        to={filtro.id === FILTRO_TODOS ? '/gestao/usuarios' : `/gestao/usuarios?filtro=${filtro.id}`}
        aria-current={ativo ? 'true' : undefined}
      >
        <b>{filtro.rotulo}</b>
        <em>{filtro.total}</em>
      </Link>
    </>
  );
}
