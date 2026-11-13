import { useId, useState } from 'react';
import { useGravarGestao } from '../../api/useGestao';
import { Gaveta } from '../../components/Gaveta';
import type { ConvitePedido, GestaoPayload, MudancaUsuario, UsuarioGestao } from '../../contracts/gestao';
import { erroDaGravacao, useCamposDeAcesso } from './apoio';
import { CamposDeAcesso } from './CamposDeAcesso';
import './GavetaUsuario.css';

interface Props {
  usuario: UsuarioGestao;
  /** os perfis, as empresas e as opções de sessão */
  gestao: GestaoPayload;
  onFechar: () => void;
}

/**
 * Gaveta de edição de quem já tem acesso: nome, perfil, empresas e sessão, desativar ou reativar o
 * acesso e mandar o convite de novo a quem ainda não entrou (quando a API manda `convite` na pessoa).
 * O convite de gente nova é na GavetaConvite. As regras são da API, que devolve o texto pronto quando recusa.
 * Use com `key={usuario.id}`.
 */
export function GavetaUsuario({ usuario, gestao, onFechar }: Props) {
  const id = useId();
  const [nome, setNome] = useState(usuario.nome);
  const campos = useCamposDeAcesso(gestao, {
    perfil: usuario.perfil.id,
    clientes: usuario.clientes.map((c) => c.slug),
    sessaoMinutos: usuario.sessaoMinutos,
  });
  const [semNome, setSemNome] = useState(false);
  const [reativado, setReativado] = useState(false);

  const salvar = useGravarGestao((api, m: MudancaUsuario) => api.salvarUsuario(usuario.id, m), 'acesso');
  const acesso = useGravarGestao(
    (api, ativo: boolean) => api.salvarAcessoDoUsuario(usuario.id, ativo),
    'acesso',
  );
  // o texto do passo final vem da API ("Convite na fila: sai em instantes.")
  const convite = useGravarGestao<void, ConvitePedido>((api) => api.reenviarConvite(usuario.id));
  const gravando = salvar.isPending || acesso.isPending || convite.isPending;
  const erro = [salvar, acesso, convite].find((m) => m.isError)?.error ?? null;

  const inativo = usuario.situacao.id === 'inativo';

  const aoSalvar = () => {
    if (!nome.trim()) return setSemNome(true);
    acesso.reset();
    convite.reset();
    salvar.mutate(
      {
        nome: nome.trim(),
        perfil: campos.perfil,
        clientes: campos.admin ? [] : campos.marcadas.map((c) => c.slug),
        sessaoMinutos: campos.sessao,
      },
      { onSuccess: onFechar },
    );
  };
  const mudarAcesso = (ativo: boolean) => {
    salvar.reset();
    convite.reset();
    setReativado(false);
    // desativar fecha a gaveta; reativar fica, com o aviso
    acesso.mutate(ativo, { onSuccess: ativo ? () => setReativado(true) : onFechar });
  };

  return (
    <Gaveta
      titulo={usuario.nome}
      onFechar={onFechar}
      rodape={
        <>
          {erro && (
            <p className="gst-erro gst-gaveta-erro" role="alert">
              {erroDaGravacao(erro)}
            </p>
          )}
          <span className="gst-gaveta-acesso">
            {inativo ? (
              <button type="button" className="link" disabled={gravando} onClick={() => mudarAcesso(true)}>
                Reativar acesso
              </button>
            ) : (
              usuario.podeDesativar && (
                <button
                  type="button"
                  className="link perigo"
                  disabled={gravando}
                  onClick={() => mudarAcesso(false)}
                >
                  Desativar acesso
                </button>
              )
            )}
          </span>
          <button type="button" className="btn fantasma" onClick={onFechar}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={gravando} onClick={aoSalvar}>
            Salvar alterações
          </button>
        </>
      }
    >
      {reativado && (
        <p className="gst-ok" role="status">
          Acesso reativado.
        </p>
      )}
      {convite.isSuccess && (
        <p className="gst-ok" role="status">
          {convite.data.mensagem}
        </p>
      )}
      {usuario.convite && (
        <div className="gst-reenvio">
          <span>
            <b>{usuario.situacao.rotulo}</b>
            {usuario.situacao.quando && ` · ${usuario.situacao.quando}`}
            {usuario.situacao.detalhe && <em>{usuario.situacao.detalhe}</em>}
          </span>
          <button
            type="button"
            className="btn fantasma"
            disabled={gravando}
            onClick={() => {
              salvar.reset();
              acesso.reset();
              setReativado(false);
              convite.mutate();
            }}
          >
            {usuario.convite.rotulo}
          </button>
        </div>
      )}
      <div className="gst-campo">
        <label htmlFor={`${id}-email`}>E-mail</label>
        <input
          id={`${id}-email`}
          type="email"
          value={usuario.email}
          disabled
          aria-describedby={`${id}-email-dica`}
        />
        <span id={`${id}-email-dica`} className="gst-dica">
          O e-mail é o login. Para trocar, convide o novo e desative este.
        </span>
      </div>
      <div className="gst-campo">
        <label htmlFor={`${id}-nome`}>Nome</label>
        <input
          id={`${id}-nome`}
          type="text"
          autoComplete="off"
          maxLength={120}
          value={nome}
          aria-invalid={semNome || undefined}
          aria-describedby={semNome ? `${id}-nome-erro` : undefined}
          onChange={(e) => {
            setNome(e.target.value);
            setSemNome(false);
          }}
        />
        {semNome && (
          <span id={`${id}-nome-erro`} className="gst-campo-erro" role="alert">
            Informe o nome.
          </span>
        )}
      </div>
      <CamposDeAcesso id={id} gestao={gestao} campos={campos} />
      <div className="gst-campo">
        <span className="gst-rotulo">Registro de acessos</span>
        {usuario.acessos.ultimo ? (
          <div className="gst-acessos">
            <span>
              <b>{usuario.acessos.entradas30d}</b> entradas em 30 dias
            </span>
            <span>
              Último acesso: <b>{usuario.acessos.ultimo}</b>
            </span>
          </div>
        ) : (
          <div className="gst-acessos">Ainda não entrou.</div>
        )}
      </div>
    </Gaveta>
  );
}
