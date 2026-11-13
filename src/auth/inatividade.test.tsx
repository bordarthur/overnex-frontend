import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvisoInatividade } from '../app/AvisoInatividade';
import type { SessaoAuth } from '../contracts/auth';
import { useAuth, type Auth } from './auth';
import type { AuthClient } from './authClient';
import { AuthProvider } from './AuthProvider';

const MIN = 60_000;

// O tempo de sessão parada é da pessoa e vem da API; aqui, 30 min.
const sessao = (inatividadeSegundos = 30 * 60): SessaoAuth => ({
  accessToken: 't1',
  expiraEm: new Date(Date.now() + 60 * MIN).toISOString(),
  usuario: { nome: 'Ana', email: 'ana@cliente.com.br' },
  inatividadeSegundos,
});

function clienteFalso(inatividadeSegundos?: number) {
  return {
    entrar: vi.fn<AuthClient['entrar']>(async () => sessao(inatividadeSegundos)),
    renovar: vi.fn<AuthClient['renovar']>(async () => sessao(inatividadeSegundos)),
    sair: vi.fn<AuthClient['sair']>(async () => {}),
    esqueciSenha: vi.fn<AuthClient['esqueciSenha']>(async () => {}),
    definirSenha: vi.fn<AuthClient['definirSenha']>(async () => sessao(inatividadeSegundos)),
  } satisfies AuthClient;
}

async function montar(inatividadeSegundos?: number) {
  const client = clienteFalso(inatividadeSegundos);
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
        <AvisoInatividade />
      </AuthProvider>
    </QueryClientProvider>,
  );
  await screen.findByText('autenticado');
  // O findBy volta assim que o texto aparece; espera os efeitos rodarem para o contador já estar ligado.
  await act(async () => {});
  return { client, queryClient, auth: () => ref.atual! };
}

const passar = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const aviso = () => screen.queryByRole('alertdialog', { name: 'Você ainda está aí?' });

describe('inatividade', () => {
  // Só o relógio e o setInterval: o setTimeout fica real para o findBy. O waitFor do Testing Library
  // confere com setInterval, então aqui vale o vi.waitFor, que usa os timers de verdade.
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] }));
  afterEach(() => vi.useRealTimers());

  it('avisa 2 min antes e encerra a sessão depois de 30 min sem uso', async () => {
    const { client, queryClient, auth } = await montar();

    passar(28 * MIN - 1000);
    expect(aviso()).not.toBeInTheDocument();
    passar(1000);
    expect(aviso()).toHaveTextContent('Termina em 02:00');
    expect(screen.getByRole('button', { name: 'Continuar conectado' })).toHaveFocus();

    passar(2 * MIN);
    expect(screen.getByText('anonimo')).toBeInTheDocument();
    expect(aviso()).not.toBeInTheDocument();
    expect(client.sair).toHaveBeenCalledWith('t1');
    expect(queryClient.getQueryData(['sessao'])).toBeUndefined();
    // Não é o Sair manual: o login oferece a mesma conta e volta para a tela em que estava.
    expect(auth().saiu).toBe(false);
    expect(auth().sessaoEncerrada).toEqual({ nome: 'Ana', email: 'ana@cliente.com.br' });
    expect(auth().encerradaPorInatividade).toBe(true);
  });

  it('o tempo é o da pessoa, que a API manda: com 4 h, a sessão passa dos 30 min e cai nas 4 h', async () => {
    await montar(4 * 3600);

    passar(3 * 60 * MIN);
    expect(aviso()).not.toBeInTheDocument();
    expect(screen.getByText('autenticado')).toBeInTheDocument();

    passar(58 * MIN);
    expect(aviso()).toHaveTextContent('Termina em 02:00');
    passar(2 * MIN);
    expect(screen.getByText('anonimo')).toBeInTheDocument();
  });

  it('API que ainda não manda o tempo: vale o padrão de 30 min', async () => {
    await montar(Number.NaN);

    passar(28 * MIN);
    expect(aviso()).toBeInTheDocument();
    passar(2 * MIN);
    expect(screen.getByText('anonimo')).toBeInTheDocument();
  });

  it.each([
    ['clicar', () => fireEvent.pointerDown(document.body)],
    ['digitar', () => fireEvent.keyDown(document.body, { key: 'a' })],
    ['rolar', () => fireEvent.wheel(document.body)],
    ['tocar', () => fireEvent.touchStart(document.body)],
    ['mover o mouse', () => fireEvent.pointerMove(document.body, { clientX: 10, clientY: 20 })],
  ])('%s conta como uso e recomeça os 30 min', async (_, usar) => {
    await montar();

    passar(20 * MIN);
    usar();
    passar(20 * MIN);

    expect(screen.getByText('autenticado')).toBeInTheDocument();
    expect(aviso()).not.toBeInTheDocument();
  });

  it('mouse parado no lugar não conta', async () => {
    await montar();
    fireEvent.pointerMove(document.body, { clientX: 10, clientY: 20 });

    passar(20 * MIN);
    fireEvent.pointerMove(document.body, { clientX: 10, clientY: 20 });
    passar(10 * MIN);

    expect(screen.getByText('anonimo')).toBeInTheDocument();
  });

  it('com o aviso aberto, só "Continuar conectado" fecha e recomeça os 30 min', async () => {
    const { client } = await montar();
    passar(29 * MIN);

    fireEvent.pointerMove(document.body, { clientX: 50, clientY: 50 });
    expect(aviso()).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar conectado' }));
    expect(aviso()).not.toBeInTheDocument();

    passar(29 * MIN);
    expect(screen.getByText('autenticado')).toBeInTheDocument();
    expect(client.sair).not.toHaveBeenCalled();
  });

  it('Esc no aviso também continua', async () => {
    await montar();
    passar(29 * MIN);

    fireEvent.keyDown(aviso()!, { key: 'Escape' });

    expect(aviso()).not.toBeInTheDocument();
  });

  it('"Sair agora" sai como o Sair do menu', async () => {
    const { auth } = await montar();
    passar(29 * MIN);

    fireEvent.click(screen.getByRole('button', { name: 'Sair agora' }));

    await screen.findByText('anonimo');
    expect(auth().saiu).toBe(true);
  });

  it('computador que dormiu: ao voltar depois do prazo, a sessão cai na hora', async () => {
    await montar();

    // O relógio anda sem os timers rodarem, como com a tampa do notebook fechada.
    vi.setSystemTime(Date.now() + 2 * 60 * MIN);
    passar(1000);

    expect(screen.getByText('anonimo')).toBeInTheDocument();
  });

  describe('com outras abas', () => {
    let outraAba: BroadcastChannel;
    beforeEach(() => {
      outraAba = new BroadcastChannel('overnex-sessao');
    });
    afterEach(() => outraAba.close());

    it('uso em outra aba mantém esta aberta', async () => {
      await montar();
      passar(29 * MIN);
      expect(aviso()).toBeInTheDocument();

      outraAba.postMessage({ tipo: 'atividade', em: Date.now() });

      await vi.waitFor(() => expect(aviso()).not.toBeInTheDocument());
      passar(20 * MIN);
      expect(screen.getByText('autenticado')).toBeInTheDocument();
    });

    it('sessão que caiu em outra aba cai nesta também', async () => {
      const { client, auth } = await montar();

      outraAba.postMessage({ tipo: 'venceu' });

      await screen.findByText('anonimo');
      expect(auth().encerradaPorInatividade).toBe(true);
      expect(client.sair).toHaveBeenCalled();
    });

    it('esta aba avisa as outras quando a sessão cai', async () => {
      await montar();
      // O que chega pelo canal vem de outro contexto: compara só o tipo.
      const recebidas: string[] = [];
      outraAba.onmessage = (e: MessageEvent<{ tipo: string }>) => recebidas.push(e.data.tipo);

      passar(30 * MIN);

      await vi.waitFor(() => expect(recebidas).toContain('venceu'));
    });
  });
});
