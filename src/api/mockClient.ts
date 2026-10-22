import type { SessaoPayload } from '../contracts/sessao';
import type { VisaoGeralPayload } from '../contracts/visaoGeral';
import { ApiErro, type ApiClient } from './client';
import fixture from './fixtures/visao-geral.json';

// O JSON é o contrato 1.0 transcrito do mockup; o cast passa por unknown porque o TS infere
// os literais do JSON como string/number[] em vez das uniões e tuplas do contrato.
export const fixtureVisaoGeral = fixture as unknown as VisaoGeralPayload;

/** Sessão fictícia: os períodos e as empresas que os filtros mostram no modo mock. */
export const fixtureSessao: SessaoPayload = {
  usuario: { nome: 'Usuário de desenvolvimento', email: 'dev@overnex.local' },
  cliente: { ...fixtureVisaoGeral.cliente, slug: 'demo' },
  papel: 'gestor',
  empresas: [
    { id: '0e000000-0000-4000-8000-000000000001', nome: 'Matriz Fortaleza' },
    { id: '0e000000-0000-4000-8000-000000000002', nome: 'Filial Maracanaú' },
  ],
  telas: ['VG-01'],
  periodos: [
    { id: '2026-10', rotulo: 'Outubro de 2026', dadosAte: '2026-10-12' },
    { id: '2026-09', rotulo: 'Setembro de 2026', dadosAte: '2026-09-30' },
    { id: '2026-08', rotulo: 'Agosto de 2026', dadosAte: '2026-08-31' },
  ],
};

/**
 * Cliente de desenvolvimento. Slugs especiais para ver os estados da tela:
 * - demo: a fixture completa
 * - vazio: sem seções e sem data de carga ("Ainda não há dados para este período.")
 * - erro: falha de servidor
 * - qualquer outro: sem permissão (403), como a API real responderia
 *
 * Os filtros (mês e empresa) não mudam os números: a fixture é uma só.
 */
export function criarMockClient({
  atrasoMs = 300,
  payload = fixtureVisaoGeral,
  sessao = fixtureSessao,
}: { atrasoMs?: number; payload?: VisaoGeralPayload; sessao?: SessaoPayload } = {}): ApiClient {
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
    async obterVisaoGeral(clienteSlug, _filtros, opcoes) {
      await esperar(opcoes?.signal);
      if (clienteSlug === 'demo') return payload;
      // Como a API responde antes da primeira carga do cliente.
      if (clienteSlug === 'vazio') return { ...payload, dadosAte: null, atualizadoEm: null, secoes: [] };
      if (clienteSlug === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      throw new ApiErro(403, 'Sem acesso a este cliente.');
    },
  };
}
