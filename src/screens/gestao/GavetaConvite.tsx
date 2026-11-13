import { useId, useState } from 'react';
import { useGravarGestao, useUsuariosGestao } from '../../api/useGestao';
import { Gaveta } from '../../components/Gaveta';
import type { GestaoPayload, NovoUsuario } from '../../contracts/gestao';
import { erroDaGravacao, useCamposDeAcesso } from './apoio';
import { CamposDeAcesso } from './CamposDeAcesso';
import './GavetaUsuario.css';

interface Props {
  /** os perfis, as empresas e as opções de sessão */
  gestao: GestaoPayload;
  /** slug da empresa que já vem marcada (convite aberto de dentro de uma empresa) */
  empresa?: string;
  onFechar: () => void;
}

/**
 * Gaveta de convite (`POST /api/admin/usuarios`): e-mail, nome, perfil, empresas e sessão de uma pessoa
 * nova. A API só põe o convite numa fila; o e-mail sai depois, e o passo final mostra o texto que ela
 * devolve. As regras (e-mail repetido, Admin BORD só com e-mail da BORD) são da API, com o texto
 * pronto na recusa. O perfil não vem escolhido: quem convida decide.
 */
export function GavetaConvite({ gestao, empresa, onFechar }: Props) {
  const id = useId();
  // a nota do convite vem com a lista geral de pessoas
  const { data: geral } = useUsuariosGestao();
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  // os erros de campo vazio só aparecem depois da primeira tentativa de enviar
  const [tentou, setTentou] = useState(false);
  const campos = useCamposDeAcesso(gestao, {
    perfil: '',
    clientes: empresa ? [empresa] : [],
    sessaoMinutos: null,
  });
  const convidar = useGravarGestao((api, novo: NovoUsuario) => api.convidarUsuario(novo));

  const semEmail = tentou && !email.trim();
  const semNome = tentou && !nome.trim();
  const semPerfil = tentou && !campos.perfil;

  const aoEnviar = () => {
    setTentou(true);
    if (!email.trim() || !nome.trim() || !campos.perfil) return;
    convidar.mutate({
      email: email.trim(),
      nome: nome.trim(),
      perfil: campos.perfil,
      clientes: campos.admin ? [] : campos.marcadas.map((c) => c.slug),
      sessaoMinutos: campos.sessao,
    });
  };
  // perfil, empresas e sessão ficam: quem convida várias pessoas da mesma empresa só troca nome e e-mail
  const outraPessoa = () => {
    convidar.reset();
    setEmail('');
    setNome('');
    setTentou(false);
  };

  if (convidar.isSuccess)
    return (
      <Gaveta
        titulo="Convidar usuário"
        onFechar={onFechar}
        rodape={
          <>
            <button type="button" className="btn fantasma" onClick={outraPessoa}>
              Convidar outra pessoa
            </button>
            <button type="button" className="btn" onClick={onFechar}>
              Concluir
            </button>
          </>
        }
      >
        <p className="gst-ok" role="status">
          {convidar.data.mensagem}
        </p>
        <div className="gst-pessoa">
          <b>{convidar.variables.nome}</b>
          <span>{convidar.variables.email}</span>
        </div>
        {geral && <p className="gst-dica">{geral.notaConvite}</p>}
      </Gaveta>
    );

  return (
    <Gaveta
      titulo="Convidar usuário"
      onFechar={onFechar}
      rodape={
        <>
          {convidar.isError && (
            <p className="gst-erro gst-gaveta-erro" role="alert">
              {erroDaGravacao(convidar.error)}
            </p>
          )}
          <button type="button" className="btn fantasma" onClick={onFechar}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={convidar.isPending} onClick={aoEnviar}>
            Enviar convite
          </button>
        </>
      }
    >
      {geral && <p className="gst-dica">{geral.notaConvite}</p>}
      <div className="gst-campo">
        <label htmlFor={`${id}-email`}>E-mail</label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="off"
          maxLength={254}
          value={email}
          aria-invalid={semEmail || undefined}
          aria-describedby={`${id}-email-${semEmail ? 'erro' : 'dica'}`}
          onChange={(e) => setEmail(e.target.value)}
        />
        {semEmail ? (
          <span id={`${id}-email-erro`} className="gst-campo-erro" role="alert">
            Informe o e-mail.
          </span>
        ) : (
          <span id={`${id}-email-dica`} className="gst-dica">
            O e-mail é o login e não muda depois.
          </span>
        )}
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
          onChange={(e) => setNome(e.target.value)}
        />
        {semNome && (
          <span id={`${id}-nome-erro`} className="gst-campo-erro" role="alert">
            Informe o nome.
          </span>
        )}
      </div>
      <CamposDeAcesso
        id={id}
        gestao={gestao}
        campos={campos}
        erroPerfil={semPerfil ? 'Escolha o perfil.' : undefined}
      />
    </Gaveta>
  );
}
