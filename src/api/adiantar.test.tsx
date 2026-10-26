import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarAuthFake } from '../auth/authFake';
import type { SessaoPayload } from '../contracts/sessao';
import { renderizarApp } from '../test/renderizar';
import { mesesParaAdiantar } from './adiantar';
import type { ApiClient } from './client';
import { criarMockClient, fixtureSessao } from './mockClient';

/** Mock que conta quantas Visões gerais estão em andamento ao mesmo tempo. */
function apiInstrumentada(obterSessao?: ApiClient['obterSessao']) {
  const base = criarMockClient({ atrasoMs: 0 });
  let ativos = 0;
  const registro = { maxAoMesmoTempo: 0 };
  const obterVisaoGeral = vi.fn<ApiClient['obterVisaoGeral']>(async (filtros, opcoes) => {
    ativos += 1;
    registro.maxAoMesmoTempo = Math.max(registro.maxAoMesmoTempo, ativos);
    try {
      await new Promise((r) => setTimeout(r, 5));
      return await base.obterVisaoGeral(filtros, opcoes);
    } finally {
      ativos -= 1;
    }
  });
  const sessao = vi.fn<ApiClient['obterSessao']>(obterSessao ?? base.obterSessao);
  const api: ApiClient = { ...base, obterSessao: sessao, obterVisaoGeral };
  // Mês de cada pedido da Visão geral, na ordem ("padrão" = sem `mes`).
  const meses = () => obterVisaoGeral.mock.calls.map(([f]) => f?.mes ?? 'padrão');
  return { api, obterVisaoGeral, obterSessao: sessao, registro, meses };
}

async function escolherMes(rotulo: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Período/ }));
  await user.click(
    within(screen.getByRole('menu', { name: 'Período' })).getByRole('menuitemradio', { name: rotulo }),
  );
}

afterEach(() => {
  // Volta ao getter do jsdom (aba visível).
  delete (document as { visibilityState?: unknown }).visibilityState;
});

describe('pedidos adiantados', () => {
  it('depois de entrar, a Visão geral sai junto com a /api/sessao, sem esperar por ela', async () => {
    let liberarSessao!: (s: SessaoPayload) => void;
    const { api, obterVisaoGeral, obterSessao } = apiInstrumentada(
      () => new Promise((resolve) => (liberarSessao = resolve)),
    );
    renderizarApp('/', undefined, api, criarAuthFake());

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('E-mail'), 'ana@cliente.com.br');
    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    // A sessão ainda não respondeu e a Visão geral já foi pedida.
    await waitFor(() => expect(obterVisaoGeral).toHaveBeenCalledWith({}, expect.anything()));
    expect(obterSessao).toHaveBeenCalledTimes(1);

    act(() => liberarSessao(fixtureSessao));
    expect(await screen.findByRole('heading', { level: 3, name: 'Vendas' })).toBeInTheDocument();
    // A tela aproveitou o pedido adiantado.
    expect(obterVisaoGeral.mock.calls.filter(([f]) => !f?.mes)).toHaveLength(1);
  });

  it('depois da primeira tela, pede os 2 meses anteriores, um por vez', async () => {
    const { api, registro, meses } = apiInstrumentada();
    renderizarApp('/demo/visao-geral', undefined, api);
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });

    await waitFor(() => expect(meses()).toEqual(['padrão', '2026-09', '2026-08']));
    expect(registro.maxAoMesmoTempo).toBe(1);
  });

  it('trocar para um mês adiantado não faz pedido novo, nem para o vizinho que já está no cache', async () => {
    const { api, meses } = apiInstrumentada();
    renderizarApp('/demo/visao-geral', undefined, api);
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    await waitFor(() => expect(meses()).toHaveLength(3));

    await escolherMes('Setembro de 2026');
    expect(screen.getByRole('region', { name: 'Visão geral' })).toHaveAttribute('aria-busy', 'false');
    await escolherMes('Agosto de 2026');
    await new Promise((r) => setTimeout(r, 30));

    expect(meses()).toEqual(['padrão', '2026-09', '2026-08']);
  });

  it('com a aba escondida, espera ela voltar para adiantar', async () => {
    let visibilidade = 'hidden';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibilidade });
    const { api, meses } = apiInstrumentada();
    renderizarApp('/demo/visao-geral', undefined, api);
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    await new Promise((r) => setTimeout(r, 30));
    expect(meses()).toEqual(['padrão']);

    visibilidade = 'visible';
    act(() => void document.dispatchEvent(new Event('visibilitychange')));

    await waitFor(() => expect(meses()).toEqual(['padrão', '2026-09', '2026-08']));
  });

  it('sair apaga o que foi adiantado', async () => {
    const { api, meses } = apiInstrumentada();
    const { queryClient } = renderizarApp('/demo/visao-geral', undefined, api);
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    await waitFor(() => expect(meses()).toHaveLength(3));
    expect(queryClient.getQueryCache().findAll({ queryKey: ['visao-geral'] })).toHaveLength(3);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }));

    await screen.findByRole('heading', { level: 1, name: 'Entrar' });
    expect(queryClient.getQueryCache().findAll()).toHaveLength(0);
  });
});

describe('meses para adiantar', () => {
  const periodos = ['2026-10', '2026-09', '2026-08', '2026-07'];

  it.each([
    [undefined, ['2026-09', '2026-08']],
    ['2026-09', ['2026-08']],
    ['2026-07', []],
    ['2025-01', []],
  ])('mês %s → %j', (mes, esperado) => {
    expect(mesesParaAdiantar(periodos, mes)).toEqual(esperado);
  });
});
