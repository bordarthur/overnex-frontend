import type {
  Cartao,
  CartaoProvisoes,
  MudancaGrupoProvisao,
  PainelPayload,
  TabelaNomes,
  TelaPainel,
} from '../contracts/painel';
import type { PersonaFake } from '../auth/personasFake';
import type { SessaoPayload } from '../contracts/sessao';
import { CODIGO_DA_TELA, type TelaApp } from '../contracts/telas';
import type { Indicador, Secao, VisaoGeralPayload } from '../contracts/visaoGeral';
import { ApiErro, type ApiClient } from './client';
import {
  MSG,
  clienteDoBanco,
  criarBancoGestao,
  criarEmpresa,
  gestaoDoBanco,
  mudarEmpresa,
  pedirConvite,
  repedirConvite,
  gravarPreferenciaDoCliente,
  mudarAcessoDoPerfil,
  mudarAcessoDoUsuario,
  mudarPainel,
  mudarPreferencia,
  mudarSessaoDoUsuario,
  mudarUsuario,
  preferenciaDoCliente,
  salvarFeriado,
  sessaoDoBanco,
  tirarFeriado,
  usuarioDaPersona,
  usuariosDoBanco,
} from './mockGestao';
import fixtureClientes from './fixtures/clientes.json';
import fixtureEquipe from './fixtures/equipe-comercial.json';
import fixtureFluxoCaixa from './fixtures/fluxo-caixa.json';
import fixtureFluxoCaixaProvisoes from './fixtures/fluxo-caixa-provisoes.json';
import fixturePessoas from './fixtures/pessoas.json';
import fixturePessoasNomes from './fixtures/pessoas-cargos-salarios-nomes.json';
import fixtureReceberPagar from './fixtures/receber-pagar.json';
import fixtureResultado from './fixtures/resultado.json';
import fixtureVendas from './fixtures/vendas.json';
import fixtureLinhasCusto from './fixtures/visao-geral-linhas-custo.json';
import fixture from './fixtures/visao-geral.json';

// O JSON é o contrato 1.0 transcrito do mockup; o cast passa por unknown porque o TS infere
// os literais do JSON como string/number[] em vez das uniões e tuplas do contrato.
export const fixtureVisaoGeral = fixture as unknown as VisaoGeralPayload;

/**
 * Painéis com os números dos mockups Total M2.0.1 (comerciais e financeiros) e M2.1.1 (Pessoas e o
 * realizado do Caixa, no Fluxo de caixa).
 */
export const fixturesPainel: Record<TelaPainel, PainelPayload> = {
  vendas: fixtureVendas as unknown as PainelPayload,
  'equipe-comercial': fixtureEquipe as unknown as PainelPayload,
  clientes: fixtureClientes as unknown as PainelPayload,
  resultado: fixtureResultado as unknown as PainelPayload,
  'receber-pagar': fixtureReceberPagar as unknown as PainelPayload,
  'fluxo-caixa': fixtureFluxoCaixa as unknown as PainelPayload,
  pessoas: fixturePessoas as unknown as PainelPayload,
};

/**
 * Cartões que mudam com um filtro, por `tela?filtro=opção`: no mock, os outros filtros não mudam os
 * números, mas a chave "Só lançados / Lançados + provisões" troca a projeção do Fluxo de caixa.
 */
export const variantesPainel: Record<string, Cartao[]> = {
  'fluxo-caixa?projecao=provisoes': fixtureFluxoCaixaProvisoes as unknown as Cartao[],
};

function aplicarVariantes(painel: PainelPayload, tela: TelaPainel, filtros: Record<string, string>) {
  const trocas = Object.entries(filtros).flatMap(
    ([id, valor]) => variantesPainel[`${tela}?${id}=${valor}`] ?? [],
  );
  if (trocas.length === 0) return painel;
  const porId = new Map(trocas.map((c) => [c.id, c]));
  return { ...painel, cartoes: painel.cartoes.map((c) => porId.get(c.id) ?? c) };
}

/** Provisões gravadas no mock (PUT), como o back as guardaria para o cliente. */
interface EstadoProvisoes {
  periodo?: string;
  grupos: Map<string, MudancaGrupoProvisao>;
}

/**
 * Cartão de provisões com as escolhas gravadas. Como no seletor da Visão geral, o mock só muda o
 * cartão (período, chave, valor usado e quem personalizou); os outros números não são recalculados.
 */
function aplicarProvisoes(cartao: CartaoProvisoes, estado: EstadoProvisoes, papel: string): CartaoProvisoes {
  return {
    ...cartao,
    periodo: estado.periodo ?? cartao.periodo,
    editavel: cartao.editavel && papel !== 'leitor',
    grupos: cartao.grupos.map((g) => {
      const m = estado.grupos.get(g.id);
      if (!m) return g;
      return {
        ...g,
        ligado: m.ligado,
        usado: m.valor ?? g.sugerida,
        personalizado: m.valor == null ? null : 'personalizado por você agora',
      };
    }),
  };
}

/** "Mostrar nomes": a tabela de uma linha por pessoa, por tela e cartão. Pessoas fictícias. */
export const fixturesNomes: Record<string, TabelaNomes> = {
  'pessoas/cargos-salarios': fixturePessoasNomes as unknown as TabelaNomes,
};

// Linhas de custo além das que o Automático mostra, para o seletor "Linhas de custo" no mock.
const linhasExtras = fixtureLinhasCusto.linhas as unknown as Indicador[];

/**
 * Seção com seletor, como o back a montaria para a escolha gravada: na fixture, os velocímetros
 * são as linhas do Automático e, por último, o "Outros". Com outro número de linhas, o mock corta
 * a lista (completada com as linhas extras) e só renomeia o "Outros": os números dele não mudam.
 */
function aplicarEscolha(secao: Secao, escolha: string | undefined): Secao {
  const seletor = secao.seletor;
  if (!seletor || !escolha || escolha === seletor.valor) return secao;
  const outros = secao.indicadores.at(-1);
  if (!outros) return secao;
  const linhas = [...secao.indicadores.slice(0, -1), ...linhasExtras];
  const n = escolha === 'auto' ? secao.indicadores.length - 1 : Number(escolha);
  // na fixture, além das 7 linhas há outras 9 pequenas, que vão sempre no "Outros"
  const resto = linhas.length - n + 9;
  return {
    ...secao,
    seletor: { ...seletor, valor: escolha },
    indicadores: [...linhas.slice(0, n), { ...outros, nome: `Outros (${resto} linhas)` }],
  };
}

/** Slug da empresa das fixtures das telas ("Cliente Demo"). */
export const SLUG_DEMO = 'demo';

/**
 * Sessão fictícia do usuário de desenvolvimento, que tem uma empresa só (a das fixtures): os períodos
 * e os CNPJs que os filtros mostram no modo mock e as telas liberadas.
 */
export const fixtureSessao: SessaoPayload = sessaoDoBanco(criarBancoGestao(), usuarioDaPersona('cliente'));

/**
 * Cenários da Visão geral no mock, para ver os estados da tela (VITE_MOCK_CENARIO em dev):
 * - completo: a fixture completa (padrão)
 * - vazio: sem seções e sem data de carga ("Ainda não há dados para este período.")
 * - erro: falha de servidor
 * - sem-permissao: 403, como a API real responderia
 */
export type CenarioMock = 'completo' | 'vazio' | 'erro' | 'sem-permissao';

/**
 * Cliente de desenvolvimento. Os filtros (mês e CNPJ) não mudam os números: a fixture é uma só, e
 * nas outras empresas do mock só o nome do cabeçalho muda.
 *
 * Quem está logado vem de `persona` (padrão: o usuário de desenvolvimento, com uma empresa só); a
 * sessão, as telas liberadas e a Gestão saem do banco do mock (mockGestao.ts). Com `sessao`, a
 * sessão é essa, fixa, seja qual for a empresa pedida (para testes).
 */
export function criarMockClient({
  atrasoMs = 300,
  payload = fixtureVisaoGeral,
  sessao: sessaoFixa,
  paineis = fixturesPainel,
  cenario = 'completo',
  persona = 'cliente',
}: {
  atrasoMs?: number;
  payload?: VisaoGeralPayload;
  sessao?: SessaoPayload;
  paineis?: Record<TelaPainel, PainelPayload>;
  cenario?: CenarioMock;
  persona?: PersonaFake | (() => Promise<PersonaFake>);
} = {}): ApiClient {
  const banco = criarBancoGestao();
  const quem = async () => usuarioDaPersona(typeof persona === 'function' ? await persona() : persona);
  // como GET /api/sessao: 403 para a empresa que a pessoa não pode abrir
  const sessaoDe = async (cliente?: string) =>
    sessaoFixa ?? sessaoDoBanco(banco, await quem(), cliente || undefined);
  // como as rotas de tela: a empresa precisa ser da pessoa, e a tela, estar ligada e liberada a ela
  const abrirTela = async (cliente: string, tela: TelaApp) => {
    const s = await sessaoDe(cliente);
    if (!s.cliente || !s.telas.includes(CODIGO_DA_TELA[tela])) throw new ApiErro(403, MSG.negado);
    return { ...s, cliente: s.cliente };
  };
  // as fixtures são da empresa demo; nas outras, o cabeçalho mostra a empresa aberta
  const daEmpresa = <T extends { cliente: VisaoGeralPayload['cliente'] }>(
    dados: T,
    { nome, sigla, logoUrl, slug }: NonNullable<SessaoPayload['cliente']>,
  ): T => (slug === SLUG_DEMO ? dados : { ...dados, cliente: { nome, sigla, logoUrl } });
  // provisões gravadas (PUT), por `empresa/tela/cartão`
  const provisoes = new Map<string, EstadoProvisoes>();
  const estadoProvisoes = (cliente: string, tela: TelaPainel, cartao: string) => {
    const chave = `${cliente}/${tela}/${cartao}`;
    let estado = provisoes.get(chave);
    if (!estado) provisoes.set(chave, (estado = { grupos: new Map() }));
    return estado;
  };
  // o cartão de provisões da tela, para validar o que chega no PUT como a API faria
  const cartaoProvisoes = async (cliente: string, tela: TelaPainel, cartao: string) => {
    const c = paineis[tela].cartoes.find((x) => x.id === cartao);
    if (c?.tipo !== 'provisoes') throw new ApiErro(404, 'Este cartão não tem provisões.');
    if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
    if (cenario === 'sem-permissao' || (await sessaoDe(cliente)).papel === 'leitor')
      throw new ApiErro(403, 'Você não pode mudar as provisões deste painel.');
    return c;
  };
  const esperar = (signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      if (atrasoMs <= 0) return resolve();
      const t = setTimeout(resolve, atrasoMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(signal.reason);
      });
    });
  // a Gestão é só do Admin BORD; devolve quem está gravando, para as regras que olham o autor
  const admin = async (signal?: AbortSignal) => {
    await esperar(signal);
    if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
    if (!(await sessaoDe()).gestao) throw new ApiErro(403, MSG.negado);
    return quem();
  };

  return {
    dadosFicticios: true,
    async obterSessao(cliente, opcoes) {
      await esperar(opcoes?.signal);
      return sessaoDe(cliente);
    },
    async obterVisaoGeral(cliente, _filtros, opcoes) {
      await esperar(opcoes?.signal);
      if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      if (cenario === 'sem-permissao') throw new ApiErro(403, MSG.negado);
      const { cliente: empresa } = await abrirTela(cliente, 'visao-geral');
      const dados = daEmpresa(payload, empresa);
      // Como a API responde antes da primeira carga do cliente.
      if (cenario === 'vazio') return { ...dados, dadosAte: null, atualizadoEm: null, secoes: [] };
      return {
        ...dados,
        secoes: dados.secoes.map((s) =>
          aplicarEscolha(s, s.seletor ? preferenciaDoCliente(banco, empresa.slug, s.seletor.id) : undefined),
        ),
      };
    },
    async salvarPreferenciaVisaoGeral(cliente, id, valor) {
      await esperar();
      if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      const s = await sessaoDe(cliente);
      if (s.papel === 'leitor') throw new ApiErro(403, 'Você não pode mudar esta escolha.');
      gravarPreferenciaDoCliente(banco, s.cliente?.slug ?? cliente, id, valor);
    },
    // Os filtros (mês, empresa, canal...) não mudam os números: cada tela tem uma fixture só. A
    // exceção são as variantes (a projeção com provisões) e as provisões gravadas.
    async obterPainel(cliente, tela, filtros = {}, opcoes) {
      await esperar(opcoes?.signal);
      if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      if (cenario === 'sem-permissao') throw new ApiErro(403, MSG.negado);
      const s = await abrirTela(cliente, tela);
      const painel = daEmpresa(paineis[tela], s.cliente);
      if (cenario === 'vazio')
        return {
          ...painel,
          dadosAte: null,
          atualizadoEm: null,
          destaques: [],
          kpis: [],
          apoios: [],
          cartoes: [],
        };
      const comVariantes = aplicarVariantes(painel, tela, filtros);
      return {
        ...comVariantes,
        cartoes: comVariantes.cartoes.map((c) =>
          c.tipo === 'provisoes'
            ? aplicarProvisoes(c, estadoProvisoes(cliente, tela, c.id), s.papel ?? '')
            : c,
        ),
      };
    },
    async salvarPeriodoProvisoes(cliente, tela, cartao, { periodo }) {
      await esperar();
      const c = await cartaoProvisoes(cliente, tela, cartao);
      if (!c.periodos.some((p) => p.id === periodo)) throw new ApiErro(422, 'Período inválido.');
      estadoProvisoes(cliente, tela, cartao).periodo = periodo;
    },
    async salvarGrupoProvisao(cliente, tela, cartao, grupo, mudanca) {
      await esperar();
      const c = await cartaoProvisoes(cliente, tela, cartao);
      if (!c.grupos.some((g) => g.id === grupo)) throw new ApiErro(404, 'Grupo de provisão não encontrado.');
      if (mudanca.valor != null && !(mudanca.valor >= 0))
        throw new ApiErro(422, 'O valor precisa ser zero ou mais.');
      estadoProvisoes(cliente, tela, cartao).grupos.set(grupo, mudanca);
    },
    async obterNomes(cliente, tela, cartao, _filtros, opcoes) {
      await esperar(opcoes?.signal);
      if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      if (cenario === 'sem-permissao') throw new ApiErro(403, 'Você não pode ver os nomes deste cartão.');
      await abrirTela(cliente, tela);
      const tabela = fixturesNomes[`${tela}/${cartao}`];
      if (!tabela) throw new ApiErro(404, 'Este cartão não tem nomes.');
      return tabela;
    },
    gestao: {
      async obterGestao(opcoes) {
        await admin(opcoes?.signal);
        return gestaoDoBanco(banco);
      },
      async obterCliente(slug, opcoes) {
        await admin(opcoes?.signal);
        return clienteDoBanco(banco, slug);
      },
      async obterUsuarios(opcoes) {
        await admin(opcoes?.signal);
        return usuariosDoBanco(banco);
      },
      async salvarPainel(slug, codigo, ligado) {
        await admin();
        mudarPainel(banco, slug, codigo, ligado);
      },
      async salvarAcessoDoPerfil(slug, perfil, codigo, ve) {
        await admin();
        mudarAcessoDoPerfil(banco, slug, perfil, codigo, ve);
      },
      async salvarPreferencia(slug, id, valor) {
        await admin();
        mudarPreferencia(banco, slug, id, valor);
      },
      async salvarFeriado(slug, data, nome) {
        await admin();
        salvarFeriado(banco, slug, data, nome);
      },
      async tirarFeriado(slug, data) {
        await admin();
        tirarFeriado(banco, slug, data);
      },
      async salvarUsuario(id, mudanca) {
        mudarUsuario(banco, await admin(), id, mudanca);
      },
      async salvarSessaoDoUsuario(id, minutos) {
        await admin();
        mudarSessaoDoUsuario(banco, id, minutos);
      },
      async salvarAcessoDoUsuario(id, ativo) {
        mudarAcessoDoUsuario(banco, await admin(), id, ativo);
      },
      async criarCliente(nova) {
        await admin();
        return criarEmpresa(banco, nova);
      },
      async salvarCliente(slug, mudanca) {
        await admin();
        mudarEmpresa(banco, slug, mudanca);
      },
      async convidarUsuario(novo) {
        await admin();
        return pedirConvite(banco, novo);
      },
      async reenviarConvite(id) {
        await admin();
        return repedirConvite(banco, id);
      },
    },
  };
}
