import { describe, expect, it, vi } from 'vitest';
import { fixtureVisaoGeral } from './mockClient';
import { ApiErro, semPermissao } from './client';
import { criarHttpClient } from './httpClient';

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

function criar(resposta: Response, token: string | null = 'fake:abc') {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(resposta);
  const api = criarHttpClient({ getToken: async () => token, fetch });
  return { api, fetch };
}

describe('cliente HTTP', () => {
  it('pede a Visão geral com o token e devolve o JSON', async () => {
    const { api, fetch } = criar(json(fixtureVisaoGeral));
    const controle = new AbortController();

    await expect(api.obterVisaoGeral('demo', { signal: controle.signal })).resolves.toEqual(
      fixtureVisaoGeral,
    );

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('/api/telas/visao-geral');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer fake:abc' });
    expect(init?.signal).toBe(controle.signal);
    expect(api.dadosFicticios).toBe(false);
  });

  it('não manda Authorization sem token', async () => {
    const { api, fetch } = criar(json(fixtureVisaoGeral), null);
    await api.obterVisaoGeral('demo');
    expect(fetch.mock.calls[0]![1]?.headers).not.toHaveProperty('Authorization');
  });

  it('transforma 403 em ApiErro sem permissão, com o detail da API', async () => {
    const { api } = criar(json({ detail: 'Acesso negado.' }, 403));
    const erro = await api.obterVisaoGeral('demo').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ApiErro);
    expect(erro).toMatchObject({ status: 403, message: 'Acesso negado.' });
    expect(semPermissao(erro)).toBe(true);
  });

  it('usa uma mensagem genérica quando o erro não traz detail em texto', async () => {
    const { api } = criar(new Response('Bad Gateway', { status: 502 }));
    const erro = await api.obterVisaoGeral('demo').catch((e: unknown) => e);
    expect(erro).toMatchObject({ status: 502, message: 'Erro 502 da API.' });
    expect(semPermissao(erro)).toBe(false);
  });
});
