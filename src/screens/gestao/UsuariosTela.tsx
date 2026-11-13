import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { semPermissao } from '../../api/client';
import { useGestao, useUsuariosGestao } from '../../api/useGestao';
import { CampoBusca } from '../../components/CampoBusca';
import { EstadoTela } from '../../components/EstadoTela';
import { semAcento } from '../../format';
import { FILTRO_TODOS, noFiltro, useTituloDaGestao } from './apoio';
import { GavetaUsuario } from './GavetaUsuario';
import { CelulaPessoa, CelulaSituacao, Empresas, SessaoDaPessoa } from './partesUsuarios';
import './UsuariosTela.css';

/**
 * Usuários da Gestão: quem entra no Overnex, com qual perfil, em quais empresas e por quanto tempo a
 * sessão fica aberta. O filtro escolhido fica na URL (`?filtro=`), o mesmo da lista da coluna lateral.
 */
export function UsuariosTela() {
  const gestao = useGestao();
  const consulta = useUsuariosGestao();
  const [params, setParams] = useSearchParams();
  const filtro = params.get('filtro') ?? FILTRO_TODOS;
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  useTituloDaGestao('Usuários');

  if (consulta.isPending || gestao.isPending) return <EstadoTela tipo="carregando" />;
  if (consulta.isError || gestao.isError)
    return semPermissao(consulta.error ?? gestao.error) ? (
      <EstadoTela tipo="sem-permissao" />
    ) : (
      <EstadoTela
        tipo="erro"
        onTentarDeNovo={() => {
          void consulta.refetch();
          void gestao.refetch();
        }}
      />
    );

  const { usuarios, notaConvite } = consulta.data;
  const { perfis, sessoes } = gestao.data;
  const termo = semAcento(busca.trim());
  const lista = usuarios.filter(
    (u) => noFiltro(u, filtro) && (!termo || semAcento(`${u.nome} ${u.email}`).includes(termo)),
  );
  const emEdicao = usuarios.find((u) => u.id === editando);
  const filtrar = (id: string) => setParams(id === FILTRO_TODOS ? {} : { filtro: id });

  return (
    <>
      <header className="gst-topo">
        <div>
          <h1>Usuários</h1>
          <p>
            Quem entra no Overnex, com qual perfil, em quais empresas e por quanto tempo a sessão fica aberta.
          </p>
        </div>
        <p className="gst-convite">{notaConvite}</p>
      </header>

      <div className="gst-perfis">
        {perfis.map((p) => (
          <button
            key={p.id}
            type="button"
            className="gst-perfil"
            aria-pressed={filtro === p.id}
            // clicar de novo no perfil escolhido volta a mostrar todos
            onClick={() => filtrar(filtro === p.id ? FILTRO_TODOS : p.id)}
          >
            <b>
              {p.rotulo}
              <em>{p.pessoas}</em>
            </b>
            <span>{p.descricao}</span>
            <dl>
              <dt>Empresas</dt>
              <dd>{p.clientes}</dd>
              <dt>Sessão padrão</dt>
              <dd>{p.sessaoPadraoRotulo}</dd>
            </dl>
          </button>
        ))}
      </div>

      <section className="gst-cartao" aria-label="Pessoas">
        <div className="gst-barra">
          <CampoBusca rotulo="Buscar por nome ou e-mail" valor={busca} onMudar={setBusca} />
          <span className="gst-vazio" role="status">
            {lista.length} de {usuarios.length} pessoas
          </span>
        </div>
        <div className="scroll-x">
          <table className="tbl gst-tbl">
            <thead>
              <tr>
                <th scope="col" className="l">
                  Pessoa
                </th>
                <th scope="col" className="l">
                  Perfil
                </th>
                <th scope="col" className="l">
                  Empresas
                </th>
                <th scope="col" className="l">
                  Ao entrar
                </th>
                <th scope="col" className="l">
                  Sessão cai após
                </th>
                <th scope="col" className="l">
                  Situação
                </th>
                <th scope="col">
                  <span className="visualmente-oculto">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td className="l">
                    <CelulaPessoa usuario={u} />
                  </td>
                  <td className="l gst-inteira">{u.perfil.rotulo}</td>
                  <td className="l">
                    {u.todosOsClientes ? (
                      <span className="gst-vazio">Todas</span>
                    ) : (
                      <Empresas itens={u.clientes} vazio="nenhuma" />
                    )}
                  </td>
                  <td className="l">
                    <span className={u.aoEntrar.tipo === 'nada' ? 'gst-entra nada' : 'gst-entra'}>
                      {u.aoEntrar.rotulo}
                    </span>
                  </td>
                  <td className="l">
                    <SessaoDaPessoa usuario={u} sessoes={sessoes} />
                  </td>
                  <td className="l">
                    <CelulaSituacao situacao={u.situacao} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link"
                      aria-label={`Editar ${u.nome}`}
                      onClick={() => setEditando(u.id)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="l gst-vazio">
                    Ninguém neste filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="note">
          A sessão cai depois do tempo sem mexer na tela, com aviso 2 minutos antes. O padrão vem do perfil e
          pode ser trocado por pessoa. Mais de 12 h, só Admin BORD.
        </p>
      </section>

      {emEdicao && (
        <GavetaUsuario
          key={emEdicao.id}
          usuario={emEdicao}
          gestao={gestao.data}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}
