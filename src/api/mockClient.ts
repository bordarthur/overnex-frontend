import type { PainelPayload, TelaPainel } from '../contracts/painel';
import type { SessaoPayload } from '../contracts/sessao';
import type { Indicador, Secao, VisaoGeralPayload } from '../contracts/visaoGeral';
import { ApiErro, type ApiClient } from './client';
import fixtureClientes from './fixtures/clientes.json';
import fixtureEquipe from './fixtures/equipe-comercial.json';
import fixturePessoas from './fixtures/pessoas.json';
import fixtureReceberPagar from './fixtures/receber-pagar.json';
import fixtureResultado from './fixtures/resultado.json';
import fixtureVendas from './fixtures/vendas.json';
import fixtureLinhasCusto from './fixtures/visao-geral-linhas-custo.json';
import fixture from './fixtures/visao-geral.json';

// O JSON é o contrato 1.0 transcrito do mockup; o cast passa por unknown porque o TS infere
// os literais do JSON como string/number[] em vez das uniões e tuplas do contrato.
export const fixtureVisaoGeral = fixture as unknown as VisaoGeralPayload;

/** Painéis com os números dos mockups Total M2.0.1 (comerciais e financeiros) e M2.1.1 (Pessoas). */
export const fixturesPainel: Record<TelaPainel, PainelPayload> = {
  vendas: fixtureVendas as unknown as PainelPayload,
  'equipe-comercial': fixtureEquipe as unknown as PainelPayload,
  clientes: fixtureClientes as unknown as PainelPayload,
  resultado: fixtureResultado as unknown as PainelPayload,
  'receber-pagar': fixtureReceberPagar as unknown as PainelPayload,
  pessoas: fixturePessoas as unknown as PainelPayload,
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

/** Sessão fictícia: os períodos e as empresas que os filtros mostram no modo mock. */
export const fixtureSessao: SessaoPayload = {
  usuario: { nome: 'Usuário de desenvolvimento', email: 'dev@overnex.local' },
  cliente: { ...fixtureVisaoGeral.cliente, slug: 'demo' },
  papel: 'gestor',
  empresas: [
    { id: '0e000000-0000-4000-8000-000000000001', nome: 'Matriz Fortaleza' },
    { id: '0e000000-0000-4000-8000-000000000002', nome: 'Filial Maracanaú' },
  ],
  telas: ['VG-01', 'COM-01', 'COM-02', 'COM-03', 'FIN-02', 'FIN-03', 'PES-01'],
  periodos: [
    { id: '2026-10', rotulo: 'Outubro de 2026', dadosAte: '2026-10-12' },
    { id: '2026-09', rotulo: 'Setembro de 2026', dadosAte: '2026-09-30' },
    { id: '2026-08', rotulo: 'Agosto de 2026', dadosAte: '2026-08-31' },
  ],
};

/**
 * Cenários da Visão geral no mock, para ver os estados da tela (VITE_MOCK_CENARIO em dev):
 * - completo: a fixture completa (padrão)
 * - vazio: sem seções e sem data de carga ("Ainda não há dados para este período.")
 * - erro: falha de servidor
 * - sem-permissao: 403, como a API real responderia
 */
export type CenarioMock = 'completo' | 'vazio' | 'erro' | 'sem-permissao';

/** Cliente de desenvolvimento. Os filtros (mês e empresa) não mudam os números: a fixture é uma só. */
export function criarMockClient({
  atrasoMs = 300,
  payload = fixtureVisaoGeral,
  sessao = fixtureSessao,
  paineis = fixturesPainel,
  cenario = 'completo',
}: {
  atrasoMs?: number;
  payload?: VisaoGeralPayload;
  sessao?: SessaoPayload;
  paineis?: Record<TelaPainel, PainelPayload>;
  cenario?: CenarioMock;
} = {}): ApiClient {
  // escolhas dos seletores da Visão geral (PUT), por id do seletor
  const preferencias = new Map<string, string>();
  const esperar = (signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      if (atrasoMs <= 0) return resolve();
      const t = setTimeout(resolve, atrasoMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(signal.reason);
      });
    });

  return {
    dadosFicticios: true,
    async obterSessao(opcoes) {
      await esperar(opcoes?.signal);
      return sessao;
    },
    async obterVisaoGeral(_filtros, opcoes) {
      await esperar(opcoes?.signal);
      if (cenario === 'completo')
        return {
          ...payload,
          secoes: payload.secoes.map((s) =>
            aplicarEscolha(s, s.seletor ? preferencias.get(s.seletor.id) : undefined),
          ),
        };
      // Como a API responde antes da primeira carga do cliente.
      if (cenario === 'vazio') return { ...payload, dadosAte: null, atualizadoEm: null, secoes: [] };
      if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      throw new ApiErro(403, 'Acesso negado.');
    },
    async salvarPreferenciaVisaoGeral(id, valor) {
      await esperar();
      if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      if (sessao.papel === 'leitor') throw new ApiErro(403, 'Você não pode mudar esta escolha.');
      preferencias.set(id, valor);
    },
    // Os filtros (mês, empresa, canal...) não mudam os números: cada tela tem uma fixture só.
    async obterPainel(tela, _filtros, opcoes) {
      await esperar(opcoes?.signal);
      const painel = paineis[tela];
      if (cenario === 'completo') return painel;
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
      if (cenario === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      throw new ApiErro(403, 'Acesso negado.');
    },
  };
}
