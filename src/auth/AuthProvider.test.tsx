import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SessaoAuth } from '../contracts/auth';
import { useAuth, type Auth } from './auth';
import type { AuthClient } from './authClient';
import { AuthProvider } from './AuthProvider';
import { destinoSeguro } from './destino';

const sessao = (token: string, validaPorMs = 60 * 60_000): SessaoAuth => ({
  accessToken: token,
  expiraEm: new Date(Date.now() + validaPorMs).toISOString(),
  usuario: { nome: 'Ana', email: 'ana@cliente.com.br' },
});

function clienteFalso(inicial: SessaoAuth | null) {
  return {
    entrar: vi.fn<AuthClient['entrar']>(async () => sessao('entrou')),
    renovar: vi.fn<AuthClient['renovar']>(async () => inicial),
    sair: vi.fn<AuthClient['sair']>(async () => {}),
    esqueciSenha: vi.fn<AuthClient['esqueciSenha']>(async () => {}),
    definirSenha: vi.fn<AuthClient['definirSenha']>(async () => sessao('definiu')),
  } satisfies AuthClient;
}

function montar(client: AuthClient) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['sessao'], { qualquer: true });
  const ref: { atual: Auth | null } = { atual: null };
  function Espiao() {
    ref.atual = useAuth();
    return <p>{ref.atual.estado}</p>;
  }
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={client}>
        <Espiao />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { auth: () => ref.atual!, queryClient };
}

describe('AuthProvider', () => {
  it('ao abrir, restaura a sessão pelo cookie', async () => {
    const { auth } = montar(clienteFalso(sessao('t1')));
    expect(screen.getByText('verificando')).toBeInTheDocument();
    await screen.findByText('autenticado');
    expect(auth().usuario).toEqual({ nome: 'Ana', email: 'ana@cliente.com.br' });
    await expect(auth().getToken()).resolves.toBe('t1');
  });

  it('sem cookie, fica anônimo e sem token', async () => {
    const { auth } = montar(clienteFalso(null));
    await screen.findByText('anonimo');
    await expect(auth().getToken()).resolves.toBeNull();
  });

  it('token perto de vencer: várias chamadas dividem uma renovação só', async () => {
    const client = clienteFalso(sessao('velho', 10_000));
    const { auth } = montar(client);
    await screen.findByText('autenticado');
    client.renovar.mockResolvedValue(sessao('novo'));
    client.renovar.mockClear();

    const tokens = await act(() => Promise.all([auth().getToken(), auth().getToken(), auth().getToken()]));

    expect(tokens).toEqual(['novo', 'novo', 'novo']);
    expect(client.renovar).toHaveBeenCalledTimes(1);
  });

  it('sair avisa a API com o token, apaga o cache e marca que a pessoa saiu', async () => {
    const client = clienteFalso(sessao('t1'));
    const { auth, queryClient } = montar(client);
    await screen.findByText('autenticado');

    await act(() => auth().sair());

    expect(client.sair).toHaveBeenCalledWith('t1');
    expect(screen.getByText('anonimo')).toBeInTheDocument();
    expect(auth().saiu).toBe(true);
    expect(queryClient.getQueryData(['sessao'])).toBeUndefined();
  });

  it('renovação recusada no meio do uso derruba a sessão', async () => {
    const client = clienteFalso(sessao('t1'));
    const { auth } = montar(client);
    await screen.findByText('autenticado');
    client.renovar.mockResolvedValue(null);

    await expect(act(() => auth().renovarToken())).resolves.toBeNull();
    await waitFor(() => expect(screen.getByText('anonimo')).toBeInTheDocument());
    expect(auth().saiu).toBe(false);
    // O login vai oferecer continuar com a mesma conta.
    expect(auth().sessaoEncerrada).toEqual({ nome: 'Ana', email: 'ana@cliente.com.br' });
  });

  it('sem sessão ao abrir o site não conta como sessão encerrada', async () => {
    const { auth } = montar(clienteFalso(null));
    await screen.findByText('anonimo');
    expect(auth().sessaoEncerrada).toBeNull();
  });
});

describe('destino depois de entrar', () => {
  it.each([
    ['/demo/visao-geral?mes=2026-09', '/demo/visao-geral?mes=2026-09'],
    [null, '/'],
    ['', '/'],
    ['https://exemplo.com', '/'],
    ['//exemplo.com', '/'],
    ['/\\exemplo.com', '/'],
  ])('%s → %s', (voltar, esperado) => {
    expect(destinoSeguro(voltar)).toBe(esperado);
  });
});
