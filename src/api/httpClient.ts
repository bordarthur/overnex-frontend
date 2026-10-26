import type { SessaoPayload } from '../contracts/sessao';
import type { VisaoGeralPayload } from '../contracts/visaoGeral';
import { ApiErro, type ApiClient } from './client';

interface OpcoesHttpClient {
  /** Token do usuário (de useAuth). Sem token, a chamada sai sem Authorization e a API responde 401. */
  getToken: () => Promise<string | null>;
  /** Pede um token novo depois de um 401 (de useAuth). null quando a sessão acabou. */
  renovarToken?: () => Promise<string | null>;
  /** Prefixo das rotas. Em dev o Vite faz proxy de /api para a API local; em produção, mesmo domínio. */
  baseUrl?: string;
  /** Para testes. */
  fetch?: typeof fetch;
}

/** Cliente da API real. Erros HTTP viram ApiErro com o status e o `detail` que a API mandou. */
export function criarHttpClient({
  getToken,
  renovarToken,
  baseUrl = '/api',
  fetch = globalThis.fetch,
}: OpcoesHttpClient): ApiClient {
  async function obter<T>(caminho: string, signal?: AbortSignal): Promise<T> {
    const chamar = (token: string | null) => {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      return fetch(`${baseUrl}${caminho}`, { headers, signal });
    };

    let resposta = await chamar(await getToken());
    // Token vencido ou revogado: renova uma vez e repete. Sem sessão, o AuthProvider já mandou para o login.
    if (resposta.status === 401 && renovarToken) {
      const novo = await renovarToken();
      if (novo) resposta = await chamar(novo);
    }
    if (!resposta.ok) throw new ApiErro(resposta.status, await lerDetalhe(resposta));
    return (await resposta.json()) as T;
  }

  return {
    dadosFicticios: false,
    obterSessao(opcoes) {
      return obter<SessaoPayload>('/sessao', opcoes?.signal);
    },
    obterVisaoGeral(filtros = {}, opcoes) {
      const params = new URLSearchParams();
      if (filtros.mes) params.set('mes', filtros.mes);
      if (filtros.empresa) params.set('empresa', filtros.empresa);
      const consulta = params.toString();
      return obter<VisaoGeralPayload>(`/telas/visao-geral${consulta ? `?${consulta}` : ''}`, opcoes?.signal);
    },
  };
}

// A API responde erro como {"detail": "..."}; no 422 o detail é uma lista, que não serve de mensagem.
export async function lerDetalhe(resposta: Response): Promise<string> {
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
