import type { VisaoGeralPayload } from '../contracts/visaoGeral';
import { ApiErro, type ApiClient } from './client';
import fixture from './fixtures/visao-geral.json';

// O JSON é o contrato 1.0 transcrito do mockup; o cast passa por unknown porque o TS infere
// os literais do JSON como string/number[] em vez das uniões e tuplas do contrato.
export const fixtureVisaoGeral = fixture as unknown as VisaoGeralPayload;

/**
 * Cliente de desenvolvimento. Slugs especiais para ver os estados da tela:
 * - demo: a fixture completa
 * - vazio: sem seções ("Ainda não há dados para este período.")
 * - erro: falha de servidor
 * - qualquer outro: sem permissão (403), como a API real responderia
 */
export function criarMockClient({
  atrasoMs = 300,
  payload = fixtureVisaoGeral,
}: { atrasoMs?: number; payload?: VisaoGeralPayload } = {}): ApiClient {
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
    async obterVisaoGeral(clienteSlug, opcoes) {
      await esperar(opcoes?.signal);
      if (clienteSlug === 'demo') return payload;
      if (clienteSlug === 'vazio') return { ...payload, secoes: [] };
      if (clienteSlug === 'erro') throw new ApiErro(500, 'Falha simulada do servidor.');
      throw new ApiErro(403, 'Sem acesso a este cliente.');
    },
  };
}
