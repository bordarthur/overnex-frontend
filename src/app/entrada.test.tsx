import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/client';
import { criarMockClient, fixtureSessao } from '../api/mockClient';
import type { PersonaFake } from '../auth/personasFake';
import { renderizarApp } from '../test/renderizar';

// A Gestão fica num arquivo à parte, carregado só quando a rota abre (ver App.tsx). Aqui ele é
// carregado antes, para o primeiro teste não depender do tempo dessa carga.
beforeAll(async () => {
  await import('../screens/gestao/Gestao');
});

const abrir = (rota: string, persona: PersonaFake, api = criarMockClient({ atrasoMs: 0, persona })) => ({
  api,
  ...renderizarApp(rota, undefined, api),
});

/**
 * Alguém com duas empresas que não abre a Gestão (um cliente principal de um grupo, por exemplo): o
 * consultor do mock, com a sessão sem `gestao`.
 */
function semGestao(api: ApiClient): ApiClient {
  return {
    ...api,
    obterSessao: async (cliente, opcoes) => ({ ...(await api.obterSessao(cliente, opcoes)), gestao: false }),
  };
}
const menu = () =>
  within(screen.getByRole('navigation', { name: 'Painéis' }))
    .getAllByRole('link')
    .map((a) => a.textContent);

describe('ao entrar ("/inicio")', () => {
  it('quem tem uma empresa só vai direto para a Visão geral dela, sem seletor de empresa', async () => {
    abrir('/inicio', 'cliente');
    expect(await screen.findByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });
    expect(screen.queryByRole('combobox', { name: 'Empresa' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Gestão' })).toBeNull();
  });

  it('sem a Visão geral liberada, abre a primeira tela que a pessoa tem', async () => {
    const api = criarMockClient({ atrasoMs: 0, sessao: { ...fixtureSessao, telas: ['COM-01', 'FIN-03'] } });
    renderizarApp('/inicio', undefined, api);
    expect(await screen.findByRole('heading', { level: 1, name: 'Vendas' })).toBeInTheDocument();
    await waitFor(() => expect(menu()).toEqual(['Vendas', 'Receber e pagar']));
  });

  it('o Admin BORD vai para a Gestão', async () => {
    abrir('/inicio', 'admin');
    // a primeira empresa da lista, por nome
    expect(await screen.findByRole('heading', { level: 1, name: 'Agência Aurora' })).toBeInTheDocument();
    expect(screen.getByText('Interno BORD')).toBeInTheDocument();
  });

  it('quem tem duas empresas escolhe uma, e depois troca pelo menu, cada uma com os dados e o menu dela', async () => {
    const user = userEvent.setup();
    const api = semGestao(criarMockClient({ atrasoMs: 0, persona: 'consultor' }));
    const visaoGeral = vi.spyOn(api, 'obterVisaoGeral');
    abrir('/inicio', 'consultor', api);

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
    abrir('/inicio', 'sem-empresa');
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

  it('quem não abre a Gestão vê "sem acesso", sem pedir nada a /api/admin', async () => {
    const { api } = abrir('/gestao', 'cliente');
    const gestao = vi.spyOn(api.gestao, 'obterGestao');
    expect(await screen.findByText(/Você não tem acesso a esta tela/)).toBeInTheDocument();
    expect(gestao).not.toHaveBeenCalled();
  });
});

describe('o consultor na Gestão', () => {
  const abrirConsultor = (rota: string) => {
    const api = criarMockClient({ atrasoMs: 0, persona: 'consultor' });
    const usuarios = vi.spyOn(api.gestao, 'obterUsuarios');
    abrir(rota, 'consultor', api);
    return { usuarios, user: userEvent.setup() };
  };
  const abas = () => screen.getAllByRole('tab').map((t) => t.textContent);

  it('o consultor entra na Gestão só de leitura', async () => {
    const { usuarios } = abrirConsultor('/inicio');
    // a primeira empresa da carteira, por nome
    expect(await screen.findByRole('heading', { level: 1, name: 'Cliente Demo' })).toBeInTheDocument();
    expect(screen.getByText('Interno BORD')).toBeInTheDocument();

    // a barra lateral: só as empresas dele, sem "Usuários" e sem "Nova empresa"
    const lista = screen.getByRole('navigation', { name: 'Empresas' });
    expect(
      within(lista)
        .getAllByRole('link')
        .map((a) => a.querySelector('b')?.textContent),
    ).toEqual(['Cliente Demo', 'PJ']);
    expect(screen.queryByRole('navigation', { name: 'Área da gestão' })).toBeNull();
    expect(screen.queryByRole('link', { name: /^Usuários/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nova empresa' })).toBeNull();

    // a empresa: só duas abas e, no cabeçalho, só o atalho para os painéis
    expect(abas()).toEqual(['Implantação', 'Prontidão dos dados']);
    expect(screen.queryByRole('button', { name: 'Convidar usuário' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar empresa' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Abrir os painéis desta empresa' })).toHaveAttribute(
      'href',
      '/demo',
    );
    // sem o chip de usuários
    expect(screen.queryByText(/\d+ usuários?$/)).toBeNull();
    expect(usuarios).not.toHaveBeenCalled();
  });

  it('?aba= com uma aba que o consultor não vê cai na primeira', async () => {
    const { usuarios } = abrirConsultor('/gestao/empresas/pj?aba=acesso');
    expect(await screen.findByRole('heading', { level: 1, name: 'PJ' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Implantação' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('article', { name: 'Universal Completo' })).toBeInTheDocument();
    expect(usuarios).not.toHaveBeenCalled();
  });

  it('empresa fora da carteira mostra "sem acesso" (403 da API)', async () => {
    abrirConsultor('/gestao/empresas/aurora');
    expect(await screen.findByText(/Você não tem acesso a esta tela/)).toBeInTheDocument();
  });

  it('o endereço da área Usuários volta para as empresas, sem pedir a lista', async () => {
    const { usuarios } = abrirConsultor('/gestao/usuarios');
    expect(await screen.findByRole('heading', { level: 1, name: 'Cliente Demo' })).toBeInTheDocument();
    expect(usuarios).not.toHaveBeenCalled();
  });

  it('nos painéis, o consultor tem o atalho Gestão no menu', async () => {
    abrirConsultor('/pj/vendas');
    expect(await screen.findByRole('link', { name: 'Gestão' })).toHaveAttribute('href', '/gestao');
  });
});
