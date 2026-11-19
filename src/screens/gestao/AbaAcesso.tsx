import { Fragment, useState } from 'react';
import { useGestao, useGravarGestao } from '../../api/useGestao';
import { Chave } from '../../components/Chave';
import type {
  ClienteGestaoPayload,
  LinhaDaMatriz,
  MatrizDeAcesso,
  PerfilDaMatriz,
  UsuarioDoCliente,
} from '../../contracts/gestao';
import { erroDaGravacao } from './apoio';
import { ConvidarUsuario } from './ConvidarUsuario';
import { GavetaUsuario } from './GavetaUsuario';
import { BotaoConvite, CelulaPessoa, CelulaSituacao, Empresas, SessaoDaPessoa } from './partesUsuarios';

interface Props {
  cliente: ClienteGestaoPayload['cliente'];
  usuarios: UsuarioDoCliente[];
  acesso: MatrizDeAcesso;
}

/** Aba "Usuários e acesso": quem acessa a empresa e o que cada perfil enxerga nela. */
export function AbaAcesso({ cliente, usuarios, acesso }: Props) {
  return (
    <>
      <QuemAcessa cliente={cliente} usuarios={usuarios} />
      <Matriz slug={cliente.slug} acesso={acesso} />
    </>
  );
}

function QuemAcessa({ cliente, usuarios }: Pick<Props, 'cliente' | 'usuarios'>) {
  const gestao = useGestao();
  const [editando, setEditando] = useState<string | null>(null);
  const emEdicao = usuarios.find((u) => u.id === editando);
  const sessoes = gestao.data?.sessoes ?? [];

  return (
    <section className="gst-cartao" aria-labelledby="gst-quem-titulo">
      <div className="gst-cartao-topo">
        <div>
          <h2 id="gst-quem-titulo">Quem acessa {cliente.nome}</h2>
          <p className="sub">
            Pessoas ligadas a esta empresa. Admin BORD vê todas as empresas e não aparece aqui.
          </p>
        </div>
        <ConvidarUsuario empresa={cliente.slug} rotulo={`Convidar para ${cliente.nome}`} />
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
                Outras empresas
              </th>
              <th scope="col" className="l">
                Sessão cai após
              </th>
              <th scope="col" className="l">
                Situação
              </th>
              <th scope="col">Painéis que vê</th>
              <th scope="col">
                <span className="visualmente-oculto">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="l">
                  <CelulaPessoa usuario={u} />
                </td>
                <td className="l gst-inteira">{u.perfil.rotulo}</td>
                <td className="l">
                  <Empresas itens={u.outrosClientes} vazio="só esta" />
                </td>
                <td className="l">
                  <SessaoDaPessoa usuario={u} sessoes={sessoes} />
                </td>
                <td className="l">
                  <CelulaSituacao situacao={u.situacao} />
                </td>
                <td>{u.paineisQueVe}</td>
                <td className="gst-acoes-linha">
                  <BotaoConvite usuario={u} />
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
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={7} className="l gst-vazio">
                  Ninguém de {cliente.nome} tem acesso ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {emEdicao && gestao.data && (
        <GavetaUsuario
          key={emEdicao.id}
          usuario={emEdicao}
          gestao={gestao.data}
          onFechar={() => setEditando(null)}
        />
      )}
    </section>
  );
}

/** Uma marca da matriz: se o perfil vê o painel ou, nos painéis com a chave, se vê os nomes. */
interface MarcaDaMatriz {
  chave: 've' | 'nomes';
  perfil: string;
  codigo: string;
  ligada: boolean;
}

function Matriz({ slug, acesso }: { slug: string; acesso: MatrizDeAcesso }) {
  const gravar = useGravarGestao(
    (gestao, m: MarcaDaMatriz) =>
      m.chave === 've'
        ? gestao.salvarAcessoDoPerfil(slug, m.perfil, m.codigo, m.ligada)
        : gestao.salvarNomesDoPerfil(slug, m.perfil, m.codigo, m.ligada),
    'acesso',
  );
  const gravando = gravar.isPending ? gravar.variables : undefined;
  // o valor que a chave mostra: o pedido em curso, se for dela; senão, o que veio da API
  const valor = (chave: MarcaDaMatriz['chave'], p: PerfilDaMatriz, linha: LinhaDaMatriz) => {
    if (gravando?.chave === chave && gravando.perfil === p.id && gravando.codigo === linha.codigo) {
      return gravando.ligada;
    }
    return (chave === 've' ? linha.ve : linha.nomes)?.[p.id] ?? false;
  };
  const temNomes = acesso.linhas.some((l) => l.nomes);
  const fixos = acesso.perfis
    .filter((p) => p.fixo)
    .map((p) => p.rotulo)
    .join(' e ');

  return (
    <section className="gst-cartao" aria-labelledby="gst-matriz-titulo" aria-busy={gravar.isPending}>
      <h2 id="gst-matriz-titulo">O que cada perfil enxerga nesta empresa</h2>
      <p className="sub">
        Os perfis são iguais para todas as empresas; aqui se define, para esta, quais painéis cada perfil vê.
        Só aparecem os painéis ligados.
      </p>
      {gravar.isError && (
        <p className="gst-erro" role="alert">
          {erroDaGravacao(gravar.error)}
        </p>
      )}
      <div className="scroll-x">
        <table className="tbl gst-tbl gst-matriz">
          <thead>
            <tr>
              <th scope="col" className="l">
                Painel
              </th>
              {acesso.perfis.map((p) => (
                <th key={p.id} scope="col" className="c">
                  {p.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {acesso.linhas.map((linha) => (
              <Fragment key={linha.codigo}>
                <tr>
                  <th scope="row" className="l forte">
                    {linha.nome}
                  </th>
                  {acesso.perfis.map((p) => (
                    <td key={p.id} className="c">
                      <Chave
                        rotulo={`${p.rotulo} vê ${linha.nome}`}
                        ocultarRotulo
                        ligada={valor('ve', p, linha)}
                        desabilitada={p.fixo || gravar.isPending}
                        onMudar={(ligada) =>
                          gravar.mutate({ chave: 've', perfil: p.id, codigo: linha.codigo, ligada })
                        }
                      />
                    </td>
                  ))}
                </tr>
                {linha.nomes && (
                  <tr className="gst-matriz-nomes">
                    <th scope="row" className="l">
                      Vê os nomes
                    </th>
                    {acesso.perfis.map((p) => (
                      <td key={p.id} className="c">
                        {/* a chave só existe onde o perfil vê o painel */}
                        {valor('ve', p, linha) && (
                          <Chave
                            rotulo={`${p.rotulo} vê os nomes em ${linha.nome}`}
                            ocultarRotulo
                            ligada={valor('nomes', p, linha)}
                            desabilitada={p.fixo || gravar.isPending}
                            onMudar={(ligada) =>
                              gravar.mutate({ chave: 'nomes', perfil: p.id, codigo: linha.codigo, ligada })
                            }
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                )}
              </Fragment>
            ))}
            {acesso.linhas.length === 0 && (
              <tr>
                <td colSpan={acesso.perfis.length + 1} className="l gst-vazio">
                  Nenhum painel ligado nesta empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {fixos && (
        <p className="note">
          {fixos} vê tudo e não pode ser alterado. Painel ligado sem nenhum outro perfil marcado só é visto
          por {fixos}: serve para validar antes de liberar ao cliente.
        </p>
      )}
      {temNomes && (
        <p className="note">
          &quot;Vê os nomes&quot; libera os nomes das pessoas no painel. Tirar o painel do perfil apaga essa
          marca: ao pôr de volta, o painel volta sem nomes.
        </p>
      )}
    </section>
  );
}
