import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../auth/auth';
import { CampoTexto } from '../../components/CampoTexto';
import { emailValido, useContagem, useTremer } from './apoio';
import { LayoutAcesso } from './LayoutAcesso';
import { mensagemErro } from './mensagemErro';

// Intervalo entre reenvios, o mesmo que o Supabase Auth impõe para o e-mail de recuperação.
const REENVIO_S = 60;

/** /esqueci-senha (mockup Login M2.0.0): pede o e-mail e depois mostra "Confira seu e-mail". */
export function EsqueciSenhaTela() {
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  return enviadoPara ? <LinkEnviado email={enviadoPara} /> : <PedirLink onEnviado={setEnviadoPara} />;
}

function PedirLink({ onEnviado }: { onEnviado: (email: string) => void }) {
  const { esqueciSenha } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [formRef, tremer] = useTremer<HTMLFormElement>();
  const emailRef = useRef<HTMLInputElement>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const email = String(new FormData(evento.currentTarget).get('email') ?? '').trim();
    if (!emailValido(email)) {
      setErro('Digite um e-mail completo, como nome@empresa.com.br.');
      tremer();
      emailRef.current?.focus();
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await esqueciSenha(email);
      onEnviado(email);
    } catch (e) {
      setErro(mensagemErro(e));
      setEnviando(false);
      tremer();
    }
  }

  return (
    <LayoutAcesso
      titulo="Redefinir a senha"
      subtitulo="Informe o e-mail do seu acesso. Mandamos um link para criar uma senha nova."
    >
      <form ref={formRef} className="acesso-form" onSubmit={(e) => void enviar(e)} noValidate>
        {erro && (
          <p className="acesso-msg" role="alert">
            {erro}
          </p>
        )}
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
        <button type="submit" className="acesso-btn" aria-busy={enviando}>
          Enviar link
        </button>
      </form>
      <p className="acesso-abaixo">
        <Link className="link" to="/entrar">
          Voltar para entrar
        </Link>
      </p>
    </LayoutAcesso>
  );
}

function LinkEnviado({ email }: { email: string }) {
  const { esqueciSenha } = useAuth();
  const { restante, reiniciar } = useContagem(REENVIO_S);
  const [erro, setErro] = useState<string | null>(null);

  async function reenviar() {
    setErro(null);
    reiniciar(REENVIO_S);
    try {
      await esqueciSenha(email);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  return (
    <LayoutAcesso
      marca="envelope"
      titulo="Confira seu e-mail"
      subtitulo={
        // A mesma resposta exista o e-mail ou não: a tela não revela quem tem acesso.
        <>
          Se <b>{email}</b> tiver acesso ao Overnex, o link chega em alguns minutos. Veja também a caixa de
          spam.
        </>
      }
    >
      {erro && (
        <p className="acesso-msg solta" role="alert">
          {erro}
        </p>
      )}
      <p className="acesso-abaixo">
        Não chegou?{' '}
        {restante > 0 ? (
          <span>
            Reenviar em <span className="acesso-contagem">{restante}</span> s
          </span>
        ) : (
          <button type="button" className="link" onClick={() => void reenviar()}>
            Reenviar
          </button>
        )}
      </p>
      <p className="acesso-abaixo">
        <Link className="link" to="/entrar">
          Voltar para entrar
        </Link>
      </p>
    </LayoutAcesso>
  );
}
