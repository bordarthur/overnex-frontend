import type { ClienteGestaoPayload, GestaoPayload, UsuariosPayload } from '../contracts/gestao';
import type { PainelPayload, TabelaNomes } from '../contracts/painel';
import type { SessaoPayload } from '../contracts/sessao';
import type { VisaoGeralPayload } from '../contracts/visaoGeral';
import { ApiErro, mensagemSemDetalhe, type ApiClient } from './client';

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

type Metodo = 'GET' | 'PUT' | 'DELETE';

/** Cliente da API real. Erros HTTP viram ApiErro com o status e o `detail` que a API mandou. */
export function criarHttpClient({
  getToken,
  renovarToken,
  baseUrl = '/api',
  fetch = globalThis.fetch,
}: OpcoesHttpClient): ApiClient {
  async function pedir(
    caminho: string,
    { signal, metodo = 'GET', corpo }: { signal?: AbortSignal; metodo?: Metodo; corpo?: unknown } = {},
  ): Promise<Response> {
    const chamar = (token: string | null) => {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (corpo !== undefined) headers['Content-Type'] = 'application/json';
      const body = corpo === undefined ? undefined : JSON.stringify(corpo);
      return fetch(`${baseUrl}${caminho}`, { method: metodo, headers, body, signal });
    };

    let resposta = await chamar(await getToken());
    // Token vencido ou revogado: renova uma vez e repete. Sem sessão, o AuthProvider já mandou para o login.
    if (resposta.status === 401 && renovarToken) {
      const novo = await renovarToken();
      if (novo) resposta = await chamar(novo);
    }
    if (!resposta.ok) throw new ApiErro(resposta.status, await lerDetalhe(resposta));
    return resposta;
  }

  async function obter<T>(caminho: string, signal?: AbortSignal): Promise<T> {
    return (await (await pedir(caminho, { signal })).json()) as T;
  }

  // gravações respondem 204, sem corpo
  async function gravar(caminho: string, corpo: unknown): Promise<void> {
    await pedir(caminho, { metodo: 'PUT', corpo });
  }

  return {
    dadosFicticios: false,
    obterSessao(cliente, opcoes) {
      return obter<SessaoPayload>(`/sessao${consulta(cliente)}`, opcoes?.signal);
    },
    obterVisaoGeral(cliente, filtros = {}, opcoes) {
      return obter<VisaoGeralPayload>(
        `/telas/visao-geral${consulta(cliente, { mes: filtros.mes, empresa: filtros.empresa })}`,
        opcoes?.signal,
      );
    },
    salvarPreferenciaVisaoGeral(cliente, id, valor, filtros = {}) {
      return gravar(
        `/telas/visao-geral/preferencias/${encodeURIComponent(id)}${consulta(cliente, { empresa: filtros.empresa })}`,
        { valor },
      );
    },
    obterPainel(cliente, tela, filtros = {}, opcoes) {
      return obter<PainelPayload>(`/telas/${tela}${consulta(cliente, filtros)}`, opcoes?.signal);
    },
    salvarPeriodoProvisoes(cliente, tela, cartao, mudanca, filtros = {}) {
      return gravar(
        `${caminhoCartao(tela, cartao)}/periodo${consulta(cliente, { empresa: filtros.empresa })}`,
        mudanca,
      );
    },
    salvarGrupoProvisao(cliente, tela, cartao, grupo, mudanca, filtros = {}) {
      return gravar(
        `${caminhoCartao(tela, cartao)}/grupos/${encodeURIComponent(grupo)}${consulta(cliente, { empresa: filtros.empresa })}`,
        mudanca,
      );
    },
    obterNomes(cliente, tela, cartao, filtros = {}, opcoes) {
      return obter<TabelaNomes>(
        `${caminhoCartao(tela, cartao)}/nomes${consulta(cliente, filtros)}`,
        opcoes?.signal,
      );
    },
    gestao: {
      obterGestao(opcoes) {
        return obter<GestaoPayload>('/admin/gestao', opcoes?.signal);
      },
      obterCliente(slug, opcoes) {
        return obter<ClienteGestaoPayload>(caminhoCliente(slug), opcoes?.signal);
      },
      obterUsuarios(opcoes) {
        return obter<UsuariosPayload>('/admin/usuarios', opcoes?.signal);
      },
      salvarPainel(slug, codigo, ligado) {
        return gravar(`${caminhoCliente(slug)}/paineis/${encodeURIComponent(codigo)}`, { ligado });
      },
      salvarAcessoDoPerfil(slug, perfil, codigo, ve) {
        return gravar(
          `${caminhoCliente(slug)}/perfis/${encodeURIComponent(perfil)}/paineis/${encodeURIComponent(codigo)}`,
          { ve },
        );
      },
      salvarPreferencia(slug, id, valor) {
        return gravar(`${caminhoCliente(slug)}/preferencias/${encodeURIComponent(id)}`, { valor });
      },
      salvarFeriado(slug, data, nome) {
        return gravar(`${caminhoCliente(slug)}/feriados/${encodeURIComponent(data)}`, { nome });
      },
      async tirarFeriado(slug, data) {
        await pedir(`${caminhoCliente(slug)}/feriados/${encodeURIComponent(data)}`, { metodo: 'DELETE' });
      },
      salvarUsuario(id, mudanca) {
        return gravar(caminhoUsuario(id), mudanca);
      },
      salvarSessaoDoUsuario(id, minutos) {
        return gravar(`${caminhoUsuario(id)}/sessao`, { minutos });
      },
      salvarAcessoDoUsuario(id, ativo) {
        return gravar(`${caminhoUsuario(id)}/acesso`, { ativo });
      },
    },
  };
}

const caminhoCartao = (tela: string, cartao: string) =>
  `/telas/${tela}/cartoes/${encodeURIComponent(cartao)}`;
const caminhoCliente = (slug: string) => `/admin/clientes/${encodeURIComponent(slug)}`;
const caminhoUsuario = (id: string) => `/admin/usuarios/${encodeURIComponent(id)}`;

/**
 * A query da chamada: `cliente` (o slug da empresa escolhida) primeiro, depois os filtros com valor.
 * `cliente` é nome reservado: um filtro com esse id não passa por cima do slug.
 */
function consulta(cliente: string | undefined, filtros: Record<string, string | undefined> = {}): string {
  const params = new URLSearchParams();
  if (cliente) params.set('cliente', cliente);
  for (const [id, valor] of Object.entries(filtros)) {
    if (valor && id !== 'cliente') params.set(id, valor);
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

// A API responde erro como {"detail": "..."}; no 422 de formato o detail é uma lista, que não serve de mensagem.
export async function lerDetalhe(resposta: Response): Promise<string> {
  try {
    const corpo: unknown = await resposta.json();
    if (corpo && typeof corpo === 'object' && 'detail' in corpo && typeof corpo.detail === 'string') {
      return corpo.detail;
    }
  } catch {
    // Corpo vazio ou que não é JSON (ex.: proxy sem a API no ar).
  }
  return mensagemSemDetalhe(resposta.status);
}
