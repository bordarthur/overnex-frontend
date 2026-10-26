import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ApiErro } from '../../api/client';
import { useAuth } from '../../auth/auth';
import { atendeRequisitos, REQUISITOS_SENHA } from '../../auth/senha';
import { CampoTexto } from '../../components/CampoTexto';
import type { TipoLink } from '../../contracts/auth';
import { useTremer } from './apoio';
import { LayoutAcesso } from './LayoutAcesso';
import { mensagemErro } from './mensagemErro';

// O link do e-mail do Supabase traz ?token_hash=…&type=invite|recovery.
const TIPO_DO_LINK: Record<string, TipoLink> = { invite: 'convite', recovery: 'recuperacao' };

const TEXTOS: Record<
  TipoLink,
  { titulo: string; subtitulo: string; rotuloSenha: string; botao: string; repetir: boolean }
> = {
  // O convite do mockup não pede para repetir a senha (o botão de mostrar a senha cobre isso).
  convite: {
    titulo: 'Crie seu acesso',
    subtitulo: 'Escolha a senha para entrar no Overnex pela primeira vez.',
    rotuloSenha: 'Crie uma senha',
    botao: 'Criar acesso',
    repetir: false,
  },
  recuperacao: {
    titulo: 'Crie uma senha nova',
    subtitulo: 'Escolha a senha que vai usar para entrar.',
    rotuloSenha: 'Senha nova',
    botao: 'Salvar senha',
    repetir: true,
  },
};

/**
 * /definir-senha (mockup Login M2.0.0): primeiro acesso (convite) e senha nova (recuperação), abertas
 * pelo link do e-mail. Link sem token ou recusado pela API (410) mostra "Este link não vale mais".
 */
export function DefinirSenhaTela() {
  const [params] = useSearchParams();
  const [vencido, setVencido] = useState(false);
  const tokenHash = params.get('token_hash');
  const tipo = TIPO_DO_LINK[params.get('type') ?? ''];

  if (!tokenHash || !tipo || vencido) return <LinkVencido />;
  return <FormSenha tokenHash={tokenHash} tipo={tipo} onVencido={() => setVencido(true)} />;
}

interface PropsFormSenha {
  tokenHash: string;
  tipo: TipoLink;
  onVencido: () => void;
}

function FormSenha({ tokenHash, tipo, onVencido }: PropsFormSenha) {
  const { definirSenha } = useAuth();
  const navegar = useNavigate();
  const textos = TEXTOS[tipo];
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [formRef, tremer] = useTremer<HTMLFormElement>();
  const senhaRef = useRef<HTMLInputElement>(null);
  const repetirRef = useRef<HTMLInputElement>(null);

  function recusar(mensagem: string, campo?: HTMLInputElement | null) {
    setErro(mensagem);
    tremer();
    campo?.focus();
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    // Os requisitos são conferidos aqui só para avisar antes; quem decide é a API.
    if (!atendeRequisitos(senha))
      return recusar('A senha ainda não cumpre os três requisitos.', senhaRef.current);
    if (textos.repetir && senha !== String(new FormData(evento.currentTarget).get('repetir')))
      return recusar('As duas senhas estão diferentes.', repetirRef.current);

    setErro(null);
    setEnviando(true);
    try {
      await definirSenha({ tokenHash, tipo, senha });
      navegar('/', { replace: true });
    } catch (e) {
      setEnviando(false);
      if (e instanceof ApiErro && e.status === 410) return onVencido();
      recusar(mensagemErro(e));
    }
  }

  return (
    <LayoutAcesso titulo={textos.titulo} subtitulo={textos.subtitulo}>
      <form ref={formRef} className="acesso-form" onSubmit={(e) => void enviar(e)} noValidate>
        {erro && (
          <p className="acesso-msg" role="alert">
            {erro}
          </p>
        )}
        <CampoTexto
          ref={senhaRef}
          rotulo={textos.rotuloSenha}
          name="senha"
          type="password"
          autoComplete="new-password"
          autoFocus
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          dica={
            <ul className="acesso-requisitos" aria-label="Requisitos da senha">
              {REQUISITOS_SENHA.map((r) => {
                const atende = r.atende(senha);
                return (
                  <li key={r.id} className={atende ? 'atende' : undefined}>
                    {r.rotulo}
                    <span className="visualmente-oculto">{atende ? ' (cumprido)' : ' (pendente)'}</span>
                  </li>
                );
              })}
            </ul>
          }
        />
        {textos.repetir && (
          <CampoTexto
            ref={repetirRef}
            rotulo="Repita a senha"
            name="repetir"
            type="password"
            autoComplete="new-password"
          />
        )}
        <button type="submit" className="acesso-btn" aria-busy={enviando}>
          {textos.botao}
        </button>
      </form>
    </LayoutAcesso>
  );
}

function LinkVencido() {
  return (
    <LayoutAcesso
      marca="relogio"
      titulo="Este link não vale mais"
      subtitulo="Links para criar ou redefinir senha valem por pouco tempo e só podem ser usados uma vez. Peça um novo; ele chega em alguns minutos."
    >
      <div className="acesso-form">
        <Link className="acesso-btn" to="/esqueci-senha">
          Pedir um link novo
        </Link>
        <Link className="acesso-btn secundario" to="/entrar">
          Voltar para entrar
        </Link>
      </div>
      <p className="acesso-abaixo">Era um convite? Peça um novo ao seu consultor BORD.</p>
    </LayoutAcesso>
  );
}
