import { describe, expect, it, vi } from 'vitest';
import type { SessaoAuth } from '../contracts/auth';
import { criarAuthHttp } from './authClient';

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

const SESSAO: SessaoAuth = {
  accessToken: 'jwt',
  expiraEm: '2026-10-23T15:00:00Z',
  usuario: { nome: 'Ana', email: 'ana@cliente.com.br' },
};

function criar(...respostas: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  respostas.forEach((r) => fetch.mockResolvedValueOnce(r));
  return { auth: criarAuthHttp({ fetch }), fetch };
}

describe('cliente de autenticação', () => {
  it('entrar manda e-mail e senha em JSON e devolve a sessão', async () => {
    const { auth, fetch } = criar(json(SESSAO));
    await expect(auth.entrar('ana@cliente.com.br', 'segredo')).resolves.toEqual(SESSAO);

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('/api/auth/entrar');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'ana@cliente.com.br', senha: 'segredo' });
  });

  it('entrar recusado vira ApiErro com o detail', async () => {
    const { auth } = criar(json({ detail: 'E-mail ou senha incorretos.' }, 401));
    await expect(auth.entrar('ana@cliente.com.br', 'x')).rejects.toMatchObject({
      status: 401,
      message: 'E-mail ou senha incorretos.',
    });
  });

  it('tentativas demais: o 429 traz o Retry-After em segundos', async () => {
    const resposta = new Response(JSON.stringify({ detail: 'Foram 5 tentativas com a senha errada.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '900' },
    });
    const { auth } = criar(resposta);
    await expect(auth.entrar('ana@cliente.com.br', 'x')).rejects.toMatchObject({
      status: 429,
      message: 'Foram 5 tentativas com a senha errada.',
      tentarDeNovoEmS: 900,
    });
  });

  it('renovar sem cookie válido devolve null', async () => {
    const { auth } = criar(json({ detail: 'Não autenticado.' }, 401));
    await expect(auth.renovar()).resolves.toBeNull();
  });

  it('renovar com a API fora do ar lança erro, não derruba a sessão', async () => {
    const { auth } = criar(json({ detail: 'Autenticação indisponível.' }, 503));
    await expect(auth.renovar()).rejects.toMatchObject({ status: 503 });
  });

  it('sair manda o token para a API revogar a sessão', async () => {
    const { auth, fetch } = criar(new Response(null, { status: 204 }));
    await auth.sair('jwt');
    expect(fetch.mock.calls[0]![0]).toBe('/api/auth/sair');
    expect(fetch.mock.calls[0]![1]?.headers).toMatchObject({ Authorization: 'Bearer jwt' });
  });

  it('definir senha manda o token do link, o tipo e a senha', async () => {
    const { auth, fetch } = criar(json(SESSAO));
    await auth.definirSenha({ tokenHash: 'h', tipo: 'convite', senha: 'segredo123' });
    expect(fetch.mock.calls[0]![0]).toBe('/api/auth/definir-senha');
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({
      tokenHash: 'h',
      tipo: 'convite',
      senha: 'segredo123',
    });
  });
});
