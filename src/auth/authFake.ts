import { ApiErro } from '../api/client';
import type { SessaoAuth } from '../contracts/auth';
import type { AuthClient } from './authClient';
import { atendeRequisitos } from './senha';

// SÓ PARA DESENVOLVIMENTO (VITE_AUTH_MODO=fake): imita /api/auth/* sem API.
// O token `fake:<object_id>` só vale na API local com AMBIENTE=dev e AUTH_FAKE=1; fora disso a API recusa.
// O object_id padrão é o do usuário de desenvolvimento do back (diretoria@lannconsult.com.br, PJ Cortes).
const OBJECT_ID_PADRAO = import.meta.env.VITE_AUTH_FAKE_OBJECT_ID || '0d000000-0000-4000-8000-0000000001a1';
const CHAVE_LOGADO = 'overnex-auth-fake';
const EMAIL_PADRAO = 'dev@overnex.local';

/** Senha que o fake recusa, para ver o erro de login. */
export const SENHA_ERRADA_FAKE = 'errada';
/** Senha que simula o acesso pausado depois de tentativas demais (429). */
export const SENHA_BLOQUEADA_FAKE = 'bloqueada';
/** Senha que abre uma sessão que não renova: no primeiro pedido depois de 30 s, vira "Sua sessão terminou". */
export const SENHA_SESSAO_CURTA_FAKE = 'expira';
/** token_hash que o fake recusa, para ver o link vencido. */
export const LINK_VENCIDO_FAKE = 'vencido';

interface OpcoesAuthFake {
  /** Começa com sessão aberta. */
  logado?: boolean;
  /** Guarda só um indicador "logado" no sessionStorage (nunca o token), para o login sobreviver ao reload. */
  lembrar?: boolean;
  atrasoMs?: number;
  objectId?: string;
}

/**
 * Regras do fake (os textos imitam os que a API manda):
 * - entrar: qualquer e-mail; senha "errada" responde 401, "bloqueada" responde 429 e "expira" abre uma
 *   sessão curta que não renova
 * - definir senha: token_hash "vencido" responde 410; senha sem os requisitos responde 400
 */
export function criarAuthFake({
  logado = false,
  lembrar = false,
  atrasoMs = 0,
  objectId = OBJECT_ID_PADRAO,
}: OpcoesAuthFake = {}): AuthClient {
  let email: string | null = logado ? EMAIL_PADRAO : lembrar ? lerLembrado() : null;
  let sessaoCurta = false;

  const esperar = () => new Promise<void>((resolve) => setTimeout(resolve, atrasoMs));

  function abrir(novoEmail: string, validaPorMs = 60 * 60_000): SessaoAuth {
    email = novoEmail;
    if (lembrar) gravarLembrado(novoEmail);
    return {
      accessToken: `fake:${objectId}`,
      expiraEm: new Date(Date.now() + validaPorMs).toISOString(),
      usuario: { nome: 'Usuário de desenvolvimento', email: novoEmail },
    };
  }

  return {
    async entrar(novoEmail, senha) {
      await esperar();
      if (senha === SENHA_ERRADA_FAKE)
        throw new ApiErro(401, 'E-mail ou senha não conferem. Confira os dois e tente de novo.');
      if (senha === SENHA_BLOQUEADA_FAKE)
        throw new ApiErro(429, 'Foram 5 tentativas com a senha errada.', 15 * 60);
      sessaoCurta = senha === SENHA_SESSAO_CURTA_FAKE;
      // A sessão curta já nasce a 90 s de vencer: passados 30 s, o próximo pedido tenta renovar.
      return abrir(novoEmail, sessaoCurta ? 90_000 : undefined);
    },
    async renovar() {
      await esperar();
      if (sessaoCurta) {
        sessaoCurta = false;
        email = null;
        if (lembrar) gravarLembrado(null);
      }
      return email ? abrir(email) : null;
    },
    async sair() {
      await esperar();
      email = null;
      if (lembrar) gravarLembrado(null);
    },
    async esqueciSenha() {
      await esperar();
    },
    async definirSenha({ tokenHash, senha }) {
      await esperar();
      if (tokenHash === LINK_VENCIDO_FAKE) throw new ApiErro(410, 'Este link não vale mais.');
      if (!atendeRequisitos(senha)) throw new ApiErro(400, 'A senha ainda não cumpre os três requisitos.');
      return abrir(EMAIL_PADRAO);
    },
  };
}

// sessionStorage pode faltar ou lançar erro (aba privada, armazenamento bloqueado): aí o fake só não lembra.
function lerLembrado(): string | null {
  try {
    return sessionStorage.getItem(CHAVE_LOGADO);
  } catch {
    return null;
  }
}

function gravarLembrado(email: string | null) {
  try {
    if (email) sessionStorage.setItem(CHAVE_LOGADO, email);
    else sessionStorage.removeItem(CHAVE_LOGADO);
  } catch {
    // Sem armazenamento: o login vale até recarregar a página.
  }
}
