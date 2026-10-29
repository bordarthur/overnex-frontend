import { describe, expect, it, vi } from 'vitest';
import { fixtureSessao, fixturesPainel, fixtureVisaoGeral } from './mockClient';
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

    await expect(api.obterVisaoGeral({}, { signal: controle.signal })).resolves.toEqual(fixtureVisaoGeral);

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('/api/telas/visao-geral');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer fake:abc' });
    expect(init?.signal).toBe(controle.signal);
    expect(api.dadosFicticios).toBe(false);
  });

  it('manda o mês e a empresa escolhidos na query', async () => {
    const { api, fetch } = criar(json(fixtureVisaoGeral));
    await api.obterVisaoGeral({ mes: '2026-09', empresa: '0e000000-0000-4000-8000-000000000001' });
    expect(fetch.mock.calls[0]![0]).toBe(
      '/api/telas/visao-geral?mes=2026-09&empresa=0e000000-0000-4000-8000-000000000001',
    );
  });

  it('pede um painel comercial com os filtros na query', async () => {
    // uma resposta nova a cada chamada: o corpo só pode ser lido uma vez
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () => json(fixturesPainel.vendas));
    const api = criarHttpClient({ getToken: async () => 'fake:abc', fetch });
    await expect(api.obterPainel('vendas')).resolves.toEqual(fixturesPainel.vendas);
    expect(fetch.mock.calls[0]![0]).toBe('/api/telas/vendas');

    await api.obterPainel('equipe-comercial', { mes: '2026-09', canal: 'varejo' });
    expect(fetch.mock.calls[1]![0]).toBe('/api/telas/equipe-comercial?mes=2026-09&canal=varejo');
  });

  it('grava a escolha de um seletor da Visão geral com PUT', async () => {
    const { api, fetch } = criar(new Response(null, { status: 204 }));
    await expect(api.salvarPreferenciaVisaoGeral('linhas-custo', '3')).resolves.toBeUndefined();

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('/api/telas/visao-geral/preferencias/linhas-custo');
    expect(init?.method).toBe('PUT');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer fake:abc',
      'Content-Type': 'application/json',
    });
    expect(init?.body).toBe('{"valor":"3"}');
  });

  it('a escolha vai com a empresa da tela, quando há', async () => {
    const { api, fetch } = criar(new Response(null, { status: 204 }));
    await api.salvarPreferenciaVisaoGeral('linhas-custo', 'auto', {
      empresa: '0e000000-0000-4000-8000-000000000001',
    });
    expect(fetch.mock.calls[0]![0]).toBe(
      '/api/telas/visao-geral/preferencias/linhas-custo?empresa=0e000000-0000-4000-8000-000000000001',
    );
  });

  it('a escolha recusada pela API vira ApiErro com o detail', async () => {
    const { api } = criar(json({ detail: 'Opção inválida.' }, 422));
    await expect(api.salvarPreferenciaVisaoGeral('linhas-custo', '9')).rejects.toMatchObject({
      status: 422,
      message: 'Opção inválida.',
    });
  });

  it('pede a sessão', async () => {
    const { api, fetch } = criar(json(fixtureSessao));
    await expect(api.obterSessao()).resolves.toEqual(fixtureSessao);
    expect(fetch.mock.calls[0]![0]).toBe('/api/sessao');
  });

  it('não manda Authorization sem token', async () => {
    const { api, fetch } = criar(json(fixtureVisaoGeral), null);
    await api.obterVisaoGeral();
    expect(fetch.mock.calls[0]![1]?.headers).not.toHaveProperty('Authorization');
  });

  it('transforma 403 em ApiErro sem permissão, com o detail da API', async () => {
    const { api } = criar(json({ detail: 'Acesso negado.' }, 403));
    const erro = await api.obterVisaoGeral().catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ApiErro);
    expect(erro).toMatchObject({ status: 403, message: 'Acesso negado.' });
    expect(semPermissao(erro)).toBe(true);
  });

  it('no 401, renova o token uma vez e repete a chamada', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ detail: 'Não autenticado.' }, 401))
      .mockResolvedValueOnce(json(fixtureSessao));
    const renovarToken = vi.fn(async () => 'novo');
    const api = criarHttpClient({ getToken: async () => 'velho', renovarToken, fetch });

    await expect(api.obterSessao()).resolves.toEqual(fixtureSessao);
    expect(renovarToken).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[1]![1]?.headers).toMatchObject({ Authorization: 'Bearer novo' });
  });

  it('no 401 sem sessão para renovar, devolve o erro sem repetir', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ detail: 'Não autenticado.' }, 401));
    const api = criarHttpClient({ getToken: async () => 'velho', renovarToken: async () => null, fetch });

    await expect(api.obterSessao()).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('usa uma mensagem genérica quando o erro não traz detail em texto', async () => {
    const { api } = criar(new Response('Bad Gateway', { status: 502 }));
    const erro = await api.obterVisaoGeral().catch((e: unknown) => e);
    expect(erro).toMatchObject({ status: 502, message: 'Erro 502 da API.' });
    expect(semPermissao(erro)).toBe(false);
  });
});
