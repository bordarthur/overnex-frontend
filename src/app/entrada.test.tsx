import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { criarMockClient, fixtureSessao } from '../api/mockClient';
import type { PersonaFake } from '../auth/personasFake';
import { renderizarApp } from '../test/renderizar';

// A Gestão fica num arquivo à parte, carregado só quando a rota abre (ver App.tsx). Aqui ele é
// carregado antes, para o primeiro teste não depender do tempo dessa carga.
beforeAll(async () => {
  await import('../screens/gestao/Gestao');
});

const abrir = (rota: string, persona: PersonaFake) => {
  const api = criarMockClient({ atrasoMs: 0, persona });
  return { api, ...renderizarApp(rota, undefined, api) };
};
const menu = () =>
  within(screen.getByRole('navigation', { name: 'Painéis' }))
    .getAllByRole('link')
    .map((a) => a.textContent);

describe('ao entrar ("/")', () => {
  it('quem tem uma empresa só vai direto para a Visão geral dela, sem seletor de empresa', async () => {
    abrir('/', 'cliente');
    expect(await screen.findByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    expect(screen.queryByRole('combobox', { name: 'Empresa' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Gestão' })).toBeNull();
  });

  it('sem a Visão geral liberada, abre a primeira tela que a pessoa tem', async () => {
    const api = criarMockClient({ atrasoMs: 0, sessao: { ...fixtureSessao, telas: ['COM-01', 'FIN-03'] } });
    renderizarApp('/', undefined, api);
    expect(await screen.findByRole('heading', { level: 1, name: 'Vendas' })).toBeInTheDocument();
    await waitFor(() => expect(menu()).toEqual(['Vendas', 'Receber e pagar']));
  });

  it('o Admin BORD vai para a Gestão', async () => {
    abrir('/', 'admin');
    // a primeira empresa da lista, por nome
    expect(await screen.findByRole('heading', { level: 1, name: 'Agência Aurora' })).toBeInTheDocument();
    expect(screen.getByText('Interno BORD')).toBeInTheDocument();
  });

  it('quem tem duas empresas escolhe uma, e depois troca pelo menu, cada uma com os dados e o menu dela', async () => {
    const user = userEvent.setup();
    const { api } = abrir('/', 'consultor');
    const visaoGeral = vi.spyOn(api, 'obterVisaoGeral');

    expect(await screen.findByRole('heading', { level: 1, name: 'Escolha a empresa' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['CDCliente Demo', 'PJPJ']);
    expect(visaoGeral).not.toHaveBeenCalled();

    await user.click(screen.getByRole('link', { name: 'PJ' }));
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    expect(visaoGeral).toHaveBeenCalledWith('pj', {}, expect.anything());
    expect(document.querySelector('.client-name')).toHaveTextContent('PJ');
    // na PJ, o consultor não tem Fluxo de caixa nem Pessoas
    expect(menu()).toEqual([
      'Visão geral',
      'Vendas',
      'Equipe comercial',
      'Clientes',
      'Resultado',
      'Receber e pagar',
    ]);

    const seletor = screen.getByRole('combobox', { name: 'Empresa' });
    expect(seletor).toHaveValue('pj');
    await user.selectOptions(seletor, 'Cliente Demo');
    await waitFor(() => expect(document.querySelector('.client-name')).toHaveTextContent('Cliente Demo'));
    expect(visaoGeral).toHaveBeenCalledWith('demo', {}, expect.anything());
    await waitFor(() => expect(menu()).toContain('Fluxo de caixa'));
    expect(menu()).not.toContain('Pessoas');
  });

  it('conta sem empresa: mostra o aviso da API e o botão Sair', async () => {
    const user = userEvent.setup();
    abrir('/', 'sem-empresa');
    expect(
      await screen.findByText('Sua conta ainda não tem empresa. Fale com a BORD para liberar o acesso.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });
});

describe('acesso por empresa e por tela', () => {
  it('tela fora das liberadas não aparece no menu e mostra "sem acesso"', async () => {
    abrir('/demo/pessoas', 'consultor');
    expect(await screen.findByText(/Você não tem acesso a esta tela/)).toBeInTheDocument();
    await waitFor(() => expect(menu()).toContain('Vendas'));
    expect(menu()).not.toContain('Pessoas');
    expect(screen.queryByRole('heading', { level: 1, name: 'Pessoas' })).toBeNull();
  });

  it('empresa que a pessoa não pode abrir (403 da API) mostra "sem acesso"', async () => {
    abrir('/aurora/visao-geral', 'consultor');
    expect(await screen.findByText(/Você não tem acesso a esta tela/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Vendas' })).toBeNull();
  });

  it('o Admin BORD abre qualquer empresa, com o atalho Gestão no menu', async () => {
    abrir('/horizonte/vendas', 'admin');
    expect(await screen.findByText('Projeção de fechamento')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Gestão' })).toHaveAttribute('href', '/gestao');
    expect(screen.getByRole('combobox', { name: 'Empresa' })).toHaveValue('horizonte');
  });

  it('a Gestão é só do Admin BORD', async () => {
    const { api } = abrir('/gestao', 'consultor');
    const gestao = vi.spyOn(api.gestao, 'obterGestao');
    expect(await screen.findByText(/Você não tem acesso a esta tela/)).toBeInTheDocument();
    expect(gestao).not.toHaveBeenCalled();
  });
});
