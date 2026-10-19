import type { VisaoGeralPayload } from '../contracts/visaoGeral';
import { ApiErro, type ApiClient } from './client';

interface OpcoesHttpClient {
  /** Token do usuário (de useAuth). Sem token, a chamada sai sem Authorization e a API responde 401. */
  getToken: () => Promise<string | null>;
  /** Prefixo das rotas. Em dev o Vite faz proxy de /api para a API local; em produção, mesmo domínio. */
  baseUrl?: string;
  /** Para testes. */
  fetch?: typeof fetch;
}

/** Cliente da API real. Erros HTTP viram ApiErro com o status e o `detail` que a API mandou. */
export function criarHttpClient({
  getToken,
  baseUrl = '/api',
  fetch = globalThis.fetch,
}: OpcoesHttpClient): ApiClient {
  async function obter<T>(caminho: string, signal?: AbortSignal): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const resposta = await fetch(`${baseUrl}${caminho}`, { headers, signal });
    if (!resposta.ok) throw new ApiErro(resposta.status, await lerDetalhe(resposta));
    return (await resposta.json()) as T;
  }

  return {
    dadosFicticios: false,
    // O slug da URL não vai para a API: o cliente sai do token.
    // TODO(api): mandar empresa e mês quando o GET /api/telas/visao-geral existir no back.
    obterVisaoGeral(_clienteSlug, opcoes) {
      return obter<VisaoGeralPayload>('/telas/visao-geral', opcoes?.signal);
    },
  };
}

// A API responde erro como {"detail": "..."}; no 422 o detail é uma lista, que não serve de mensagem.
async function lerDetalhe(resposta: Response): Promise<string> {
  try {
    const corpo: unknown = await resposta.json();
    if (corpo && typeof corpo === 'object' && 'detail' in corpo && typeof corpo.detail === 'string') {
      return corpo.detail;
    }
  } catch {
    // Corpo vazio ou que não é JSON (ex.: proxy sem a API no ar).
  }
  return `Erro ${resposta.status} da API.`;
}
