import { ApiErro } from '../api/client';
import { lerDetalhe } from '../api/httpClient';
import type { PedidoDefinirSenha, SessaoAuth } from '../contracts/auth';

/** Chamadas de /api/auth/*. Erros HTTP viram ApiErro com o `detail` da API. */
export interface AuthClient {
  entrar(email: string, senha: string): Promise<SessaoAuth>;
  /** Troca o cookie de refresh por um token novo. null quando não há sessão (401). */
  renovar(): Promise<SessaoAuth | null>;
  sair(accessToken: string | null): Promise<void>;
  /** A API responde 204 sempre, exista o e-mail ou não. */
  esqueciSenha(email: string): Promise<void>;
  definirSenha(pedido: PedidoDefinirSenha): Promise<SessaoAuth>;
}

interface OpcoesAuthHttp {
  baseUrl?: string;
  /** Para testes. */
  fetch?: typeof fetch;
}

/** Cliente real. O cookie de refresh vai junto sozinho: front e API dividem o domínio. */
export function criarAuthHttp({
  baseUrl = '/api/auth',
  fetch = globalThis.fetch,
}: OpcoesAuthHttp = {}): AuthClient {
  async function enviar(caminho: string, corpo: unknown, token?: string | null): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${baseUrl}${caminho}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(corpo),
      credentials: 'same-origin',
    });
  }

  // No 429 (tentativas demais), o Retry-After diz em quantos segundos dá para tentar de novo.
  async function erro(resposta: Response): Promise<ApiErro> {
    const espera = Number(resposta.headers.get('Retry-After'));
    return new ApiErro(
      resposta.status,
      await lerDetalhe(resposta),
      resposta.status === 429 && espera > 0 ? espera : undefined,
    );
  }

  async function sessao(resposta: Response): Promise<SessaoAuth> {
    if (!resposta.ok) throw await erro(resposta);
    return (await resposta.json()) as SessaoAuth;
  }

  async function semCorpo(resposta: Response): Promise<void> {
    if (!resposta.ok) throw await erro(resposta);
  }

  return {
    async entrar(email, senha) {
      return sessao(await enviar('/entrar', { email, senha }));
    },
    async renovar() {
      const resposta = await enviar('/renovar', {});
      if (resposta.status === 401) return null;
      return sessao(resposta);
    },
    async sair(accessToken) {
      await semCorpo(await enviar('/sair', {}, accessToken));
    },
    async esqueciSenha(email) {
      await semCorpo(await enviar('/esqueci-senha', { email }));
    },
    async definirSenha(pedido) {
      return sessao(await enviar('/definir-senha', pedido));
    },
  };
}
