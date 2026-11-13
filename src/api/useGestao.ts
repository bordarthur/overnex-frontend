import { queryOptions, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { semPermissao, useApiClient, type ApiClient, type GestaoApi } from './client';
import { CHAVE_PAINEL } from './usePainel';
import { CHAVE_SESSAO } from './useSessao';
import { CHAVE_VISAO_GERAL } from './useVisaoGeral';

/** Começo da query key de tudo da Gestão (/api/admin/*). */
export const CHAVE_GESTAO = 'gestao';

const tentarDeNovo = (falhas: number, erro: unknown) => !semPermissao(erro) && falhas < 2;

const opcoesGestao = (api: ApiClient) =>
  queryOptions({
    queryKey: [CHAVE_GESTAO, 'moldura'],
    queryFn: ({ signal }) => api.gestao.obterGestao({ signal }),
    retry: tentarDeNovo,
  });

const opcoesClienteGestao = (api: ApiClient, slug: string) =>
  queryOptions({
    queryKey: [CHAVE_GESTAO, 'cliente', slug],
    queryFn: ({ signal }) => api.gestao.obterCliente(slug, { signal }),
    retry: tentarDeNovo,
  });

const opcoesUsuariosGestao = (api: ApiClient) =>
  queryOptions({
    queryKey: [CHAVE_GESTAO, 'usuarios'],
    queryFn: ({ signal }) => api.gestao.obterUsuarios({ signal }),
    retry: tentarDeNovo,
  });

/** As empresas (com o estado das camadas), os perfis e as opções de sessão. */
export const useGestao = () => useQuery(opcoesGestao(useApiClient()));

/** Tudo das abas de uma empresa. */
export const useClienteGestao = (slug: string) => useQuery(opcoesClienteGestao(useApiClient(), slug));

/** Todas as pessoas, os filtros da lista e a nota do convite. */
export const useUsuariosGestao = () => useQuery(opcoesUsuariosGestao(useApiClient()));

/** O que mais uma gravação da Gestão muda, além das telas da própria Gestão. */
export type AlcanceDaGravacao =
  /** só a Gestão */
  | 'gestao'
  /** painel, perfil ou pessoa: muda também o menu e o acesso de quem está logado (/api/sessao) */
  | 'acesso'
  /** escolha gravada da empresa (linhas de custo): muda a Visão geral dela */
  | 'visao-geral'
  /** feriado: muda os dias úteis das telas */
  | 'telas';

const TAMBEM: Record<AlcanceDaGravacao, QueryKey[]> = {
  gestao: [],
  acesso: [[CHAVE_SESSAO]],
  'visao-geral': [[CHAVE_VISAO_GERAL]],
  telas: [[CHAVE_VISAO_GERAL], [CHAVE_PAINEL]],
};

/**
 * Uma gravação da Gestão. A API responde 204 e não devolve o estado novo: depois de gravar, a Gestão
 * é pedida de novo (e, conforme o `alcance`, também a sessão ou as telas). A gravação só termina
 * quando a Gestão nova chega; até lá, `variables` diz o que está sendo gravado.
 */
export function useGravarGestao<T>(
  gravar: (gestao: GestaoApi, mudanca: T) => Promise<void>,
  alcance: AlcanceDaGravacao = 'gestao',
) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mudanca: T) => gravar(api.gestao, mudanca),
    onSuccess: () => {
      // o que não está na tela agora só fica marcado como velho; pede de novo quando abrir
      for (const queryKey of TAMBEM[alcance]) void queryClient.invalidateQueries({ queryKey });
      return queryClient.invalidateQueries({ queryKey: [CHAVE_GESTAO] });
    },
  });
}
