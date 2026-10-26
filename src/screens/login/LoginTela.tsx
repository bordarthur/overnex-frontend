import { useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from 'react';
import { Link } from 'react-router';
import { ApiErro } from '../../api/client';
import { useAuth } from '../../auth/auth';
import { CampoTexto } from '../../components/CampoTexto';
import type { UsuarioAuth } from '../../contracts/auth';
import { emailValido, iniciais, minutosESegundos, useContagem, useTremer } from './apoio';
import { LayoutAcesso } from './LayoutAcesso';
import { mensagemErro } from './mensagemErro';

/**
 * /entrar (mockup Login M2.0.0): o formulário de entrar, o "Acesso pausado" (429, tentativas demais)
 * e o "Sua sessão terminou" (a sessão caiu no meio do uso; só pede a senha da mesma conta).
 */
export function LoginTela() {
  const { sessaoEncerrada } = useAuth();
  const [outraConta, setOutraConta] = useState(false);
  const [bloqueio, setBloqueio] = useState<ApiErro | null>(null);

  if (bloqueio) return <AcessoPausado erro={bloqueio} onVoltar={() => setBloqueio(null)} />;
  return (
    <FormEntrar
      conta={outraConta ? null : sessaoEncerrada}
      onOutraConta={() => setOutraConta(true)}
      onBloqueio={setBloqueio}
    />
  );
}

interface PropsFormEntrar {
  /** Sessão encerrada: a conta que estava logada. */
  conta: UsuarioAuth | null;
  onOutraConta: () => void;
  onBloqueio: (erro: ApiErro) => void;
}

function FormEntrar({ conta, onOutraConta, onBloqueio }: PropsFormEntrar) {
  const { entrar } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [senhaInvalida, setSenhaInvalida] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [formRef, tremer] = useTremer<HTMLFormElement>();
  const emailRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);

  function recusar(mensagem: string, campo: RefObject<HTMLInputElement | null>) {
    setErro(mensagem);
    tremer();
    campo.current?.focus();
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const dados = new FormData(evento.currentTarget);
    const email = conta?.email ?? String(dados.get('email') ?? '').trim();
    const senha = String(dados.get('senha') ?? '');
    if (!emailValido(email)) return recusar('Digite um e-mail completo, como nome@empresa.com.br.', emailRef);
    if (!senha) return recusar('Digite a senha.', senhaRef);

    setErro(null);
    setEnviando(true);
    try {
      // Deu certo: o SoAnonimo leva para a tela pedida.
      await entrar(email, senha);
    } catch (e) {
      setEnviando(false);
      if (e instanceof ApiErro && e.status === 429) return onBloqueio(e);
      setSenhaInvalida(e instanceof ApiErro && e.status === 401);
      recusar(mensagemErro(e), senhaRef);
      senhaRef.current?.select();
    }
  }

  const verCapsLock = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState('CapsLock'));

  const campoSenha = (
    <CampoTexto
      ref={senhaRef}
      rotulo="Senha"
      name="senha"
      type="password"
      autoComplete="current-password"
      autoFocus={!!conta}
      invalido={senhaInvalida}
      onChange={() => setSenhaInvalida(false)}
      onKeyDown={verCapsLock}
      onKeyUp={verCapsLock}
      acaoRotulo={
        conta ? undefined : (
          <Link className="link" to="/esqueci-senha">
            Esqueci a senha
          </Link>
        )
      }
      dica={capsLock ? <span className="acesso-caps">A tecla Caps Lock está ligada.</span> : undefined}
    />
  );

  const formulario = (
    <form ref={formRef} className="acesso-form" onSubmit={(e) => void enviar(e)} noValidate>
      {erro && (
        <p className="acesso-msg" role="alert">
          {erro}
        </p>
      )}
      {!conta && (
        <CampoTexto
          ref={emailRef}
          rotulo="E-mail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="nome@empresa.com.br"
          autoFocus
        />
      )}
      {campoSenha}
      <button type="submit" className="acesso-btn" aria-busy={enviando}>
        {conta ? 'Continuar' : 'Entrar'}
      </button>
    </form>
  );

  if (conta)
    return (
      <LayoutAcesso
        titulo="Sua sessão terminou"
        subtitulo="Por segurança, a sessão foi encerrada. Entre de novo para continuar de onde parou."
      >
        <div className="acesso-quem">
          <span className="acesso-avatar" aria-hidden="true">
            {iniciais(conta.nome ?? conta.email)}
          </span>
          <div>
            <b>{conta.nome ?? conta.email}</b>
            {conta.nome && <span>{conta.email}</span>}
          </div>
        </div>
        {formulario}
        <p className="acesso-abaixo">
          Não é você?{' '}
          <button type="button" className="link" onClick={onOutraConta}>
            Entrar com outra conta
          </button>
        </p>
      </LayoutAcesso>
    );

  return (
    <LayoutAcesso titulo="Entrar" subtitulo="Use o e-mail cadastrado pela sua empresa.">
      {formulario}
      <p className="acesso-abaixo">
        Recebeu um convite por e-mail? Abra o link do convite para criar sua senha.
      </p>
    </LayoutAcesso>
  );
}

/** 429: tentativas demais. O texto vem da API; o tempo, do Retry-After quando ela manda. */
function AcessoPausado({ erro, onVoltar }: { erro: ApiErro; onVoltar: () => void }) {
  const { restante } = useContagem(erro.tentarDeNovoEmS ?? 0);
  const espera = !erro.tentarDeNovoEmS ? (
    ' Você pode redefinir a senha agora.'
  ) : restante > 0 ? (
    <>
      {' '}
      Você pode tentar de novo em <span className="acesso-contagem">{minutosESegundos(restante)}</span>, ou
      redefinir a senha agora.
    </>
  ) : (
    ' Você já pode tentar de novo.'
  );

  return (
    <LayoutAcesso
      marca="cadeado"
      titulo="Acesso pausado por segurança"
      subtitulo={
        <>
          {erro.message}
          {espera}
        </>
      }
    >
      <div className="acesso-form">
        <Link className="acesso-btn" to="/esqueci-senha">
          Redefinir a senha
        </Link>
        <button type="button" className="acesso-btn secundario" onClick={onVoltar}>
          Voltar para entrar
        </button>
      </div>
      <p className="acesso-abaixo">Não foi você? Avise o seu consultor BORD.</p>
    </LayoutAcesso>
  );
}
