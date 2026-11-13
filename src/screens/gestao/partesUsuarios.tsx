import { useGravarGestao } from '../../api/useGestao';
import { Pill } from '../../components/Pill';
import { Selecao } from '../../components/Selecao';
import type { ItemCliente, OpcaoSessao, Situacao, UsuarioGestao } from '../../contracts/gestao';
import { erroDaGravacao, sessoesDoPerfil } from './apoio';
import './partesUsuarios.css';

/** Nome e e-mail, na primeira coluna das tabelas de pessoas. */
export function CelulaPessoa({ usuario }: { usuario: UsuarioGestao }) {
  return (
    <div className="gst-pessoa">
      <b>{usuario.nome}</b>
      <span>{usuario.email}</span>
    </div>
  );
}

/** A situação (pílula) e, embaixo, desde quando ("último acesso hoje, 9h14"). */
export function CelulaSituacao({ situacao }: { situacao: Situacao }) {
  return (
    <div className="gst-situacao">
      <Pill status={situacao.status} rotulo={situacao.rotulo} />
      {situacao.quando && <span>{situacao.quando}</span>}
    </div>
  );
}

/** Empresas como etiquetas; sem nenhuma, o texto de `vazio`. */
export function Empresas({ itens, vazio }: { itens: ItemCliente[]; vazio: string }) {
  if (itens.length === 0) return <span className="gst-vazio">{vazio}</span>;
  return (
    <>
      {itens.map((c) => (
        <span key={c.slug} className="gst-empresa">
          {c.nome}
        </span>
      ))}
    </>
  );
}

/**
 * "Sessão cai após", na linha da pessoa: trocar grava na hora. Quem está desativado não muda.
 * A API recusa o que não pode (mais de 12 h fora do Admin BORD) e o texto dela aparece embaixo.
 */
export function SessaoDaPessoa({ usuario, sessoes }: { usuario: UsuarioGestao; sessoes: OpcaoSessao[] }) {
  const gravar = useGravarGestao(
    (gestao, minutos: number) => gestao.salvarSessaoDoUsuario(usuario.id, minutos),
    'acesso',
  );
  const minutos = gravar.isPending ? gravar.variables : usuario.sessaoMinutos;
  const opcoes = sessoesDoPerfil(sessoes, usuario.perfil.id).map((s) => ({
    id: String(s.minutos),
    rotulo: s.rotulo,
  }));
  // um tempo fora da lista (gravado por outro caminho) aparece como está
  if (!opcoes.some((o) => o.id === String(minutos)))
    opcoes.push({ id: String(minutos), rotulo: `${minutos} min` });

  return (
    <div className="gst-sessao">
      <Selecao
        rotulo={`Sessão de ${usuario.nome}`}
        opcoes={opcoes}
        valor={String(minutos)}
        desabilitada={usuario.situacao.id === 'inativo' || gravar.isPending}
        onMudar={(id) => gravar.mutate(Number(id))}
      />
      {gravar.isError && (
        <span className="gst-sessao-erro" role="alert">
          {erroDaGravacao(gravar.error)}
        </span>
      )}
    </div>
  );
}
