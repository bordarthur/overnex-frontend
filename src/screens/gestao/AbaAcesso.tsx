import { useState } from 'react';
import { useGestao, useGravarGestao } from '../../api/useGestao';
import { Chave } from '../../components/Chave';
import type { ClienteGestaoPayload, MatrizDeAcesso, UsuarioDoCliente } from '../../contracts/gestao';
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

function Matriz({ slug, acesso }: { slug: string; acesso: MatrizDeAcesso }) {
  const gravar = useGravarGestao(
    (gestao, m: { perfil: string; codigo: string; ve: boolean }) =>
      gestao.salvarAcessoDoPerfil(slug, m.perfil, m.codigo, m.ve),
    'acesso',
  );
  const gravando = gravar.isPending ? gravar.variables : undefined;
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
              <tr key={linha.codigo}>
                <th scope="row" className="l forte">
                  {linha.nome}
                </th>
                {acesso.perfis.map((p) => {
                  const pendente = gravando?.perfil === p.id && gravando.codigo === linha.codigo;
                  return (
                    <td key={p.id} className="c">
                      <Chave
                        rotulo={`${p.rotulo} vê ${linha.nome}`}
                        ocultarRotulo
                        ligada={pendente ? gravando.ve : (linha.ve[p.id] ?? false)}
                        desabilitada={p.fixo || gravar.isPending}
                        onMudar={(ve) => gravar.mutate({ perfil: p.id, codigo: linha.codigo, ve })}
                      />
                    </td>
                  );
                })}
              </tr>
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
    </section>
  );
}
