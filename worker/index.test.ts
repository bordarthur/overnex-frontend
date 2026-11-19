// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import worker, { ehApi, repassar, type Env } from './index';

const API = 'https://overnex-api.azurewebsites.net';

function env(extra: Partial<Env> = {}): Env {
  return {
    ASSETS: { fetch: vi.fn(async () => new Response('site')) } as unknown as Fetcher,
    API_ORIGEM: API,
    PROXY_SEGREDO: 'segredo-de-teste',
    ...extra,
  };
}

function chamarApi(resposta = new Response(null, { status: 204 })) {
  return vi.fn<typeof fetch>(async () => resposta);
}

describe('Worker: repasse de /api', () => {
  it('só /api e /api/* são da API', () => {
    expect(ehApi('/api')).toBe(true);
    expect(ehApi('/api/sessao')).toBe(true);
    expect(ehApi('/apis')).toBe(false);
    expect(ehApi('/gestao')).toBe(false);
  });

  it('repassa o caminho, a consulta, o método e o corpo para a API', async () => {
    const chamar = chamarApi();
    const pedido = new Request(
      'https://overnex.exemplo/api/admin/clientes/pj-cortes/preferencias/x?cliente=a',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t' },
        body: '{"valor":"1"}',
      },
    );

    await repassar(pedido, env(), chamar);

    const [destino, init] = chamar.mock.calls[0]!;
    expect(String(destino)).toBe(`${API}/api/admin/clientes/pj-cortes/preferencias/x?cliente=a`);
    expect(init?.method).toBe('PUT');
    expect(init?.redirect).toBe('manual');
    expect(await new Response(init?.body).text()).toBe('{"valor":"1"}');
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer t');
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('o IP, o segredo e o host vêm do Worker, nunca de quem navega', async () => {
    const chamar = chamarApi();
    const pedido = new Request('https://overnex.exemplo/api/auth/entrar', {
      method: 'POST',
      headers: {
        'cf-connecting-ip': '200.1.2.3',
        'x-forwarded-for': '9.9.9.9',
        'x-real-ip': '9.9.9.9',
        forwarded: 'for=9.9.9.9',
        'x-proxy-segredo': 'forjado',
      },
      body: '{}',
    });

    await repassar(pedido, env(), chamar);

    const headers = new Headers(chamar.mock.calls[0]![1]?.headers);
    expect(headers.get('x-forwarded-for')).toBe('200.1.2.3');
    expect(headers.get('x-real-ip')).toBeNull();
    expect(headers.get('forwarded')).toBeNull();
    expect(headers.get('x-proxy-segredo')).toBe('segredo-de-teste');
    expect(headers.get('x-forwarded-host')).toBe('overnex.exemplo');
    expect(headers.get('x-forwarded-proto')).toBe('https');
  });

  it('sem segredo configurado, não manda o cabeçalho (nem o forjado)', async () => {
    const chamar = chamarApi();
    const pedido = new Request('https://overnex.exemplo/api/sessao', {
      headers: { 'x-proxy-segredo': 'forjado' },
    });

    await repassar(pedido, env({ PROXY_SEGREDO: undefined }), chamar);

    expect(new Headers(chamar.mock.calls[0]![1]?.headers).get('x-proxy-segredo')).toBeNull();
    expect(chamar.mock.calls[0]![1]?.body).toBeNull();
  });

  it('a resposta da API volta como veio, com o cookie', async () => {
    const daApi = new Response('{"accessToken":"t"}', {
      status: 200,
      headers: { 'set-cookie': 'ovx_refresh=r; Path=/api/auth; HttpOnly; Secure; SameSite=Strict' },
    });
    const resposta = await repassar(
      new Request('https://overnex.exemplo/api/auth/entrar', { method: 'POST', body: '{}' }),
      env(),
      chamarApi(daApi),
    );

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('set-cookie')).toContain('ovx_refresh=r');
    expect(await resposta.text()).toBe('{"accessToken":"t"}');
  });

  it('sem API_ORIGEM responde 503, e com a API fora do ar, 502, sem corpo', async () => {
    const pedido = () => new Request('https://overnex.exemplo/api/sessao');

    const semOrigem = await repassar(pedido(), env({ API_ORIGEM: undefined }), chamarApi());
    expect(semOrigem.status).toBe(503);
    expect(await semOrigem.text()).toBe('');

    const fora = vi.fn<typeof fetch>(async () => {
      throw new TypeError('falha de rede');
    });
    const semApi = await repassar(pedido(), env(), fora);
    expect(semApi.status).toBe(502);
    expect(await semApi.text()).toBe('');
  });

  it('o que não é /api vai para os arquivos do site', async () => {
    const e = env();
    const resposta = await worker.fetch(new Request('https://overnex.exemplo/gestao'), e);

    expect(await resposta.text()).toBe('site');
    expect(e.ASSETS.fetch).toHaveBeenCalledOnce();
  });
});
