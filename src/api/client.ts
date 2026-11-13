import { createContext, useContext } from 'react';
import type {
  ClienteGestaoPayload,
  ConvitePedido,
  EmpresaCriada,
  MudancaEmpresa,
  GestaoPayload,
  MudancaUsuario,
  NovaEmpresa,
  NovoUsuario,
  UsuariosPayload,
} from '../contracts/gestao';
import type {
  MudancaGrupoProvisao,
  MudancaPeriodoProvisoes,
  PainelPayload,
  TabelaNomes,
  TelaPainel,
} from '../contracts/painel';
import type { SessaoPayload } from '../contracts/sessao';
import type { VisaoGeralPayload } from '../contracts/visaoGeral';

// Segurança: o cliente (e, depois, a empresa) que aparece na URL é só o pedido de quem navega.
// Quem decide se o usuário pode ver aqueles dados é a API, a partir do token: slug que a pessoa não
// pode abrir responde 403. O front nunca filtra acesso.

export class ApiErro extends Error {
  readonly status: number;
  /** No 429: segundos até poder tentar de novo (cabeçalho Retry-After), quando a API manda. */
  readonly tentarDeNovoEmS?: number;

  constructor(status: number, mensagem: string, tentarDeNovoEmS?: number) {
    super(mensagem);
    this.name = 'ApiErro';
    this.status = status;
    this.tentarDeNovoEmS = tentarDeNovoEmS;
  }
}

export const semPermissao = (erro: unknown) =>
  erro instanceof ApiErro && (erro.status === 401 || erro.status === 403 || erro.status === 404);

/** Texto do ApiErro quando a resposta não traz `detail` em texto (corpo vazio, HTML, ou a lista do 422 de formato). */
export const mensagemSemDetalhe = (status: number) => `Erro ${status} da API.`;

/**
 * Para mostrar a recusa de uma gravação: o texto que a API mandou (403, 404 e 422 com `detail` em
 * texto) ou, no resto, a mensagem genérica dada.
 */
export const textoDaRecusa = (erro: unknown, generica: string) =>
  erro instanceof ApiErro &&
  [403, 404, 422].includes(erro.status) &&
  erro.message !== mensagemSemDetalhe(erro.status)
    ? erro.message
    : generica;

/** Filtros da consulta da Visão geral. Sem valor, a API usa o mês mais recente e todas as empresas. */
export interface FiltrosVisaoGeral {
  // AAAA-MM, um dos períodos de /api/sessao
  mes?: string;
  // UUID de uma empresa de /api/sessao
  empresa?: string;
}

/**
 * Filtros da consulta de um painel por cartões: `mes` e `empresa` (como na Visão geral) e os
 * filtros próprios da tela, pelo `id` que veio em `filtros` do payload (ex.: `canal`).
 * Só vai o que foi trocado; sem nada, a API usa o padrão.
 */
export type FiltrosPainel = Record<string, string>;

/**
 * Rotas /api/admin/*: a Gestão (Interno BORD), só para o Admin BORD. As gravações respondem 204;
 * a regra quebrada vem como ApiErro 422 com o texto pronto.
 */
export interface GestaoApi {
  /** Moldura da Gestão: as empresas com o estado das camadas, os perfis e as opções de sessão. */
  obterGestao(opcoes?: { signal?: AbortSignal }): Promise<GestaoPayload>;
  /** Tudo das abas de uma empresa. */
  obterCliente(slug: string, opcoes?: { signal?: AbortSignal }): Promise<ClienteGestaoPayload>;
  obterUsuarios(opcoes?: { signal?: AbortSignal }): Promise<UsuariosPayload>;
  /** Liga ou desliga o painel na empresa. */
  salvarPainel(slug: string, codigo: string, ligado: boolean): Promise<void>;
  /** Define se o perfil vê o painel na empresa (a matriz de acesso). */
  salvarAcessoDoPerfil(slug: string, perfil: string, codigo: string, ve: boolean): Promise<void>;
  salvarPreferencia(slug: string, id: string, valor: string): Promise<void>;
  /** Cadastra o feriado da empresa (ou troca o nome). `data`: AAAA-MM-DD. */
  salvarFeriado(slug: string, data: string, nome: string): Promise<void>;
  tirarFeriado(slug: string, data: string): Promise<void>;
  /** Troca nome, perfil, empresas e sessão da pessoa. O e-mail é o login e não muda. */
  salvarUsuario(id: string, mudanca: MudancaUsuario): Promise<void>;
  salvarSessaoDoUsuario(id: string, minutos: number): Promise<void>;
  /** Desativa ou reativa o acesso da pessoa. */
  salvarAcessoDoUsuario(id: string, ativo: boolean): Promise<void>;
  /** Cria a empresa (201), com todas as camadas desligadas e sem pessoas. */
  criarCliente(nova: NovaEmpresa): Promise<EmpresaCriada>;
  /** Troca o nome e o setor da empresa. O slug não muda. */
  salvarCliente(slug: string, mudanca: MudancaEmpresa): Promise<void>;
  /** Cria a pessoa e põe o convite na fila (202); o e-mail sai depois, por um job do back. */
  convidarUsuario(novo: NovoUsuario): Promise<ConvitePedido>;
  /** Manda o convite de novo a quem ainda não entrou (só quando a pessoa vem com `convite`). */
  reenviarConvite(id: string): Promise<ConvitePedido>;
}

/**
 * `cliente` é o slug da empresa escolhida (o :clienteSlug da URL), que vai em `?cliente=`. Para quem
 * tem uma empresa só ele é opcional na API; para o Admin BORD e para quem tem mais de uma, sem ele as
 * telas respondem 403. Por isso toda chamada de tela o recebe, e ele entra em toda query key.
 */
export interface ApiClient {
  /** true enquanto o cliente for o mock com dado fictício. */
  readonly dadosFicticios: boolean;
  /** Sem `cliente`: a API só devolve o cliente escolhido para quem tem um só (ver contracts/sessao.ts). */
  obterSessao(cliente?: string, opcoes?: { signal?: AbortSignal }): Promise<SessaoPayload>;
  obterVisaoGeral(
    cliente: string,
    filtros?: FiltrosVisaoGeral,
    opcoes?: { signal?: AbortSignal },
  ): Promise<VisaoGeralPayload>;
  /**
   * Grava a escolha de um seletor da Visão geral para o cliente (PUT, responde 204). Vai com a
   * mesma `empresa` da tela, se houver.
   */
  salvarPreferenciaVisaoGeral(
    cliente: string,
    id: string,
    valor: string,
    filtros?: Pick<FiltrosVisaoGeral, 'empresa'>,
  ): Promise<void>;
  /** Painéis por cartões (comerciais e financeiros): GET /api/telas/{tela}. */
  obterPainel(
    cliente: string,
    tela: TelaPainel,
    filtros?: FiltrosPainel,
    opcoes?: { signal?: AbortSignal },
  ): Promise<PainelPayload>;
  /**
   * Tabela de uma linha por pessoa de um cartão com "Mostrar nomes": GET /api/telas/{tela}/cartoes/{id}/nomes,
   * com os mesmos filtros do painel. Só é pedida com a chave ligada; a API recusa (403) quem não pode ver.
   */
  obterNomes(
    cliente: string,
    tela: TelaPainel,
    cartao: string,
    filtros?: FiltrosPainel,
    opcoes?: { signal?: AbortSignal },
  ): Promise<TabelaNomes>;
  /**
   * Cartão de provisões: grava o período da média para o cliente (PUT .../cartoes/{cartao}/periodo,
   * responde 204). Vai com a mesma `empresa` da tela, se houver. Depois, a tela precisa ser pedida de novo.
   */
  salvarPeriodoProvisoes(
    cliente: string,
    tela: TelaPainel,
    cartao: string,
    mudanca: MudancaPeriodoProvisoes,
    filtros?: { empresa?: string },
  ): Promise<void>;
  /** Cartão de provisões: grava se o grupo entra e o valor dele (PUT .../cartoes/{cartao}/grupos/{grupo}, 204). */
  salvarGrupoProvisao(
    cliente: string,
    tela: TelaPainel,
    cartao: string,
    grupo: string,
    mudanca: MudancaGrupoProvisao,
    filtros?: { empresa?: string },
  ): Promise<void>;
  readonly gestao: GestaoApi;
}

export const ApiClientContext = createContext<ApiClient | null>(null);

export function useApiClient(): ApiClient {
  const ctx = useContext(ApiClientContext);
  if (!ctx) throw new Error('useApiClient precisa estar dentro de <ApiClientContext.Provider>.');
  return ctx;
}
