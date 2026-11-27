import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { criarMockClient, fixturesPainel } from '../../api/mockClient';
import { renderizarApp } from '../../test/renderizar';

// A Leão de Ouro do mock segue a tabela de unidades da LANN: Varejo › Leão, Lupo e Usaflex, duas
// unidades cada. Quem a abre no mock é a Dora (Admin BORD).
const id = (n: number) => `0e000000-0000-4000-8000-00000000a00${n}`;
const LEAO = '/leao-de-ouro/visao-geral';

const abrir = (rota = LEAO, api = criarMockClient({ atrasoMs: 0, persona: 'admin' })) => ({
  api,
  ...renderizarApp(rota, undefined, api),
});
const botao = () => screen.getByRole('button', { name: /^Negócios|^Recolher/ });
const bandeja = () => screen.getByRole('region', { name: 'Negócios' });
const menu = () => within(screen.getByRole('navigation', { name: 'Painéis' })).getAllByRole('link');

describe('bandeja Negócios', () => {
  it('com mais de um negócio: o botão "Negócios" e, sem o chip "Unidade" na barra', async () => {
    abrir();
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    expect(botao()).toHaveTextContent('Tudo');
    expect(botao()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /Unidade/ })).toBeNull();
  });

  it('com um negócio só, fica o chip "Unidade" e não há bandeja', async () => {
    renderizarApp('/demo/visao-geral');
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    expect(screen.getByRole('button', { name: /Unidade/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Negócios/ })).toBeNull();
  });

  it('tirar um grupo pede as unidades que ficaram, leva a escolha no menu e muda o resumo', async () => {
    const user = userEvent.setup();
    const { api } = abrir();
    const consultar = vi.spyOn(api, 'obterVisaoGeral');
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });

    await user.click(botao());
    expect(botao()).toHaveAttribute('aria-expanded', 'true');
    // os valores chegam quando a bandeja abre
    expect(await within(bandeja()).findByText('Valores: faturado de 1º a 12/10')).toBeInTheDocument();

    await user.click(within(bandeja()).getByRole('button', { name: /^Lupo/ }));
    // (depois dela saem os meses anteriores adiantados, com as mesmas unidades)
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith(
        'leao-de-ouro',
        { unidades: [1, 2, 5, 6].map(id).join(',') },
        expect.anything(),
      ),
    );
    expect(within(bandeja()).getByRole('button', { name: /^Lupo/ })).toHaveAttribute('aria-pressed', 'false');
    expect(within(bandeja()).getByRole('button', { name: /^Varejo/ })).toHaveAttribute(
      'aria-pressed',
      'mixed',
    );
    // a pergunta passa a falar dos negócios marcados
    expect(screen.getByText(/Como estão os negócios marcados hoje/)).toBeInTheDocument();
    // a escolha vai junto para as outras telas da empresa (a Gestão, não)
    const paineis = menu().filter((a) => a.getAttribute('href')?.startsWith('/leao-de-ouro/'));
    expect(paineis.length).toBeGreaterThan(1);
    for (const link of paineis) expect(link.getAttribute('href')).toContain('?unidades=');

    await user.click(botao());
    expect(botao()).toHaveTextContent('Leão + Usaflex');
  });

  it('pelo menos uma unidade fica marcada', async () => {
    const user = userEvent.setup();
    abrir(`${LEAO}?unidades=${id(1)},${id(2)}`);
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    expect(botao()).toHaveTextContent('Leão · 2 unidades');

    await user.click(botao());
    await user.click(within(bandeja()).getByRole('button', { name: /^Leão/ }));
    expect(within(bandeja()).getByRole('status')).toHaveTextContent(
      'Pelo menos uma unidade fica marcada, para os gráficos não zerarem.',
    );
    expect(within(bandeja()).getByRole('button', { name: /^Leão/ })).toHaveAttribute('aria-pressed', 'true');

    // na lista, uma unidade de cada vez
    await user.click(within(bandeja()).getByRole('checkbox', { name: /Leão 2/ }));
    await user.click(botao());
    expect(botao()).toHaveTextContent('Leão 1');
  });

  it('o painel de um setor trava os outros e mostra o escopo', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({
      atrasoMs: 0,
      persona: 'admin',
      paineis: {
        ...fixturesPainel,
        vendas: {
          ...fixturesPainel.vendas,
          escopo: { setores: ['distribuidora'], rotulo: 'Este painel soma só a Distribuidora' },
        },
      },
    });
    abrir('/leao-de-ouro/vendas', api);
    await screen.findByRole('heading', { level: 1, name: 'Vendas' });
    await user.click(await screen.findByRole('button', { name: /^Negócios/ }));
    expect(within(bandeja()).getByText('Este painel soma só a Distribuidora')).toBeInTheDocument();
    expect(within(bandeja()).getByRole('button', { name: /^Varejo/ })).toBeDisabled();
    expect(within(bandeja()).getByRole('checkbox', { name: /Lupo 1/ })).toBeDisabled();
  });

  it('o painel de um setor sem unidade dele marcada mostra só o aviso da API', async () => {
    const api = criarMockClient({
      atrasoMs: 0,
      persona: 'admin',
      paineis: {
        ...fixturesPainel,
        vendas: {
          ...fixturesPainel.vendas,
          escopo: { setores: ['distribuidora'], rotulo: 'Este painel soma só a Distribuidora' },
        },
      },
    });
    abrir(`/leao-de-ouro/vendas?unidades=${id(1)}`, api);
    expect(await screen.findByText(/Volta quando ela estiver marcada em Negócios/)).toBeInTheDocument();
    expect(screen.queryByText('Ainda não há dados para este período.')).toBeNull();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('os valores da bandeja: o rótulo vem da API, e um mês sem dados é 422, como na API', async () => {
    const user = userEvent.setup();
    const { api } = abrir();
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    await expect(api.obterValoresNegocios('leao-de-ouro', { mes: '2025-01' })).rejects.toThrow(
      'Mês sem dados.',
    );
    await user.click(botao());
    expect(await within(bandeja()).findByText('Valores: faturado de 1º a 12/10')).toBeInTheDocument();
  });
});
