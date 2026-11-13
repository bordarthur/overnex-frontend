import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ApiErro } from '../../api/client';
import { criarMockClient } from '../../api/mockClient';
import { renderizarApp } from '../../test/renderizar';

// A Gestão fica num arquivo à parte, carregado só quando a rota abre (ver App.tsx). Aqui ele é
// carregado antes, para o primeiro teste não depender do tempo dessa carga.
beforeAll(async () => {
  await import('./Gestao');
});

function abrir(rota: string) {
  const api = criarMockClient({ atrasoMs: 0, persona: 'admin' });
  renderizarApp(rota, undefined, api);
  return { api, user: userEvent.setup() };
}
const chave = (nome: string) => screen.getByRole('switch', { name: nome });
const previaDoMenu = () =>
  within(screen.getByRole('complementary', { name: 'Como o cliente principal vê o menu' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

describe('Gestão: empresa', () => {
  it('mostra a empresa com os chips, as camadas e a lista de empresas com o estado de cada camada', async () => {
    abrir('/gestao/empresas/pj');
    expect(await screen.findByRole('heading', { level: 1, name: 'PJ' })).toBeInTheDocument();
    expect(screen.getByText('2 de 4 camadas ativas')).toBeInTheDocument();

    const completo = screen.getByRole('article', { name: 'Universal Completo' });
    expect(within(completo).getByText('Em implantação')).toBeInTheDocument();
    expect(within(completo).getByText('Fluxo de caixa: sem dado')).toBeInTheDocument();

    const lista = screen.getByRole('navigation', { name: 'Empresas' });
    expect(within(lista).getByRole('link', { name: /^PJ/ })).toHaveAttribute('aria-current', 'page');
    expect(within(lista).getByRole('link', { name: /^PJ/ })).toHaveTextContent('Pessoas: Desligada');
    // o que o mockup tem e não entra agora
    expect(screen.queryByText(/% concluído/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Convidar/ })).toBeNull();
  });

  it('as abas trocam pelo clique e pelas setas, e a busca filtra as empresas', async () => {
    const { user } = abrir('/gestao/empresas/demo');
    await screen.findByRole('heading', { level: 1, name: 'Cliente Demo' });

    await user.click(screen.getByRole('tab', { name: 'Prontidão dos dados' }));
    expect(screen.getByRole('tab', { name: 'Prontidão dos dados' })).toHaveAttribute('aria-selected', 'true');
    const vendas = screen.getByRole('cell', { name: 'f_vendas_demo' }).closest('tr')!;
    expect(within(vendas).getByText('412.380')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Colunas obrigatórias' })).toBeNull();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Painéis' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Painéis' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('heading', { level: 2, name: 'Últimas cargas' })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar empresa' }), 'agencia');
    const lista = screen.getByRole('navigation', { name: 'Empresas' });
    expect(within(lista).getAllByRole('link')).toHaveLength(1);
    expect(within(lista).getByRole('link')).toHaveTextContent('Agência Aurora');
  });

  it('painéis: desligar grava na API e a prévia do menu acompanha; sem dado, a chave fica travada com o motivo', async () => {
    const { api, user } = abrir('/gestao/empresas/pj?aba=paineis');
    const gravar = vi.spyOn(api.gestao, 'salvarPainel');
    await screen.findByRole('heading', { level: 1, name: 'PJ' });
    expect(previaDoMenu()).toContain('Resultado');

    await user.click(chave('Ligar Resultado'));
    expect(gravar).toHaveBeenCalledWith('pj', 'FIN-02', false);
    await waitFor(() => expect(previaDoMenu()).not.toContain('Resultado'));
    expect(chave('Ligar Resultado')).toHaveAttribute('aria-checked', 'false');
    // já ligado sempre pode ser desligado; desligado e com dado, pode ligar de novo
    expect(chave('Ligar Resultado')).toBeEnabled();

    expect(chave('Ligar Fluxo de caixa')).toBeDisabled();
    expect(screen.getByText('Sem carga de f_fluxo_* nesta empresa.')).toBeInTheDocument();
  });

  it('matriz: a coluna do Admin BORD vem marcada e travada; as outras gravam', async () => {
    const { api, user } = abrir('/gestao/empresas/demo?aba=acesso');
    const gravar = vi.spyOn(api.gestao, 'salvarAcessoDoPerfil');
    await screen.findByRole('heading', { level: 2, name: 'Quem acessa Cliente Demo' });

    expect(chave('Admin BORD vê Pessoas')).toBeChecked();
    expect(chave('Admin BORD vê Pessoas')).toBeDisabled();
    expect(chave('Cliente usuário vê Pessoas')).not.toBeChecked();

    await user.click(chave('Cliente usuário vê Pessoas'));
    expect(gravar).toHaveBeenCalledWith('demo', 'cliente_usuario', 'PES-01', true);
    await waitFor(() => expect(chave('Cliente usuário vê Pessoas')).toBeChecked());
    // quem acessa: o Admin BORD não aparece, e no lugar do convite fica a nota da API
    expect(screen.queryByText('dora@bord.com.br')).toBeNull();
    expect(await screen.findByText(/Novos acessos são criados pela equipe BORD/)).toBeInTheDocument();
  });

  it('preferências: a escolha e os feriados gravam; a recusa da API aparece como veio', async () => {
    const { api, user } = abrir('/gestao/empresas/demo?aba=preferencias');
    const preferencia = vi.spyOn(api.gestao, 'salvarPreferencia');
    const incluir = vi.spyOn(api.gestao, 'salvarFeriado');
    const tirar = vi.spyOn(api.gestao, 'tirarFeriado');
    const linhas = await screen.findByRole('region', { name: 'Linhas de custo' });

    await user.click(within(linhas).getByRole('button', { name: '3' }));
    expect(preferencia).toHaveBeenCalledWith('demo', 'linhas-custo', '3');
    await waitFor(() =>
      expect(within(linhas).getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true'),
    );

    await user.type(screen.getByLabelText('Dia'), '2026-12-24');
    await user.type(screen.getByLabelText('Nome do feriado'), 'Véspera de Natal');
    await user.click(screen.getByRole('button', { name: 'Incluir feriado' }));
    expect(incluir).toHaveBeenCalledWith('demo', '2026-12-24', 'Véspera de Natal');
    expect(await screen.findByText('24/12/2026')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do feriado')).toHaveValue('');

    tirar.mockRejectedValueOnce(new ApiErro(404, 'Feriado não encontrado.'));
    await user.click(screen.getByRole('button', { name: 'Tirar Véspera de Natal, 24/12/2026' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Feriado não encontrado.');
    await user.click(screen.getByRole('button', { name: 'Tirar Véspera de Natal, 24/12/2026' }));
    await waitFor(() => expect(screen.queryByText('24/12/2026')).toBeNull());
  });

  it('empresa que não existe mostra o texto da API', async () => {
    abrir('/gestao/empresas/nao-existe');
    expect(await screen.findByText('Empresa não encontrada.')).toBeInTheDocument();
  });
});

describe('Gestão: usuários', () => {
  const linhas = () => screen.getAllByRole('row').slice(1);

  it('lista as pessoas e filtra pela coluna lateral, pelo cartão do perfil e pela busca', async () => {
    const { user } = abrir('/gestao/usuarios');
    expect(await screen.findByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument();
    expect(await screen.findByText('12 de 12 pessoas')).toBeInTheDocument();
    expect(screen.getByText(/Novos acessos são criados pela equipe BORD/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Convidar/ })).toBeNull();

    const filtros = screen.getByRole('navigation', { name: 'Filtros de pessoas' });
    await user.click(within(filtros).getByRole('link', { name: /Convites pendentes/ }));
    expect(linhas().map((l) => within(l).getAllByRole('cell')[0]!.textContent)).toEqual([
      'Financeiro PJfinanceiro@pj.com.br',
      'Gerente da lojaloja@sabordomar.com.br',
    ]);

    await user.click(screen.getByRole('button', { name: /^Consultor por carteira/ }));
    expect(screen.getByText('2 de 12 pessoas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Consultor por carteira/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: /^Consultor por carteira/ }));
    expect(screen.getByText('12 de 12 pessoas')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nome ou e-mail' }), 'joana');
    expect(linhas()).toHaveLength(1);
    expect(within(linhas()[0]!).getByText('Sem empresa')).toBeInTheDocument();
    expect(within(linhas()[0]!).getByText('Não vê nada')).toBeInTheDocument();
  });

  it('sessão na linha: só o Admin BORD tem 24 h; trocar grava, e a recusa da API aparece', async () => {
    const { api, user } = abrir('/gestao/usuarios');
    const gravar = vi.spyOn(api.gestao, 'salvarSessaoDoUsuario');
    const doCaio = await screen.findByRole('combobox', { name: 'Sessão de Caio' });
    const opcoes = (s: HTMLElement) =>
      within(s)
        .getAllByRole('option')
        .map((o) => o.textContent);

    expect(opcoes(doCaio)).toEqual(['30 min', '1 h', '4 h', '8 h', '12 h']);
    expect(opcoes(screen.getByRole('combobox', { name: 'Sessão de Dora' }))).toContain('24 h');
    expect(screen.getByRole('combobox', { name: 'Sessão de Antigo financeiro' })).toBeDisabled();

    await user.selectOptions(doCaio, '4 h');
    expect(gravar).toHaveBeenCalledWith('0d000000-0000-4000-8000-0000000000c0', 240);
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Sessão de Caio' })).toHaveValue('240'));

    gravar.mockRejectedValueOnce(new ApiErro(422, 'Tempo de sessão inválido.'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sessão de Caio' }), '1 h');
    expect(await screen.findByRole('alert')).toHaveTextContent('Tempo de sessão inválido.');
  });

  it('gaveta: perfil Admin BORD tira a lista de empresas e volta a sessão ao padrão; a recusa da API aparece', async () => {
    const { api, user } = abrir('/gestao/usuarios');
    const salvar = vi.spyOn(api.gestao, 'salvarUsuario');
    await user.click(await screen.findByRole('button', { name: 'Editar Joana Ribeiro' }));
    const gaveta = screen.getByRole('dialog', { name: 'Joana Ribeiro' });

    expect(within(gaveta).getByLabelText('E-mail')).toBeDisabled();
    expect(
      within(gaveta).getByText('O e-mail é o login. Para trocar, convide o novo e desative este.'),
    ).toBeInTheDocument();
    expect(within(gaveta).getByLabelText('Nome')).toHaveFocus();
    expect(
      within(gaveta).getByText('Sem empresa, a pessoa entra e não vê nada. Marque pelo menos uma.'),
    ).toBeInTheDocument();
    expect(within(gaveta).queryByRole('button', { name: /convite/i })).toBeNull();

    // uma empresa: abre direto; duas: escolhe
    await user.click(within(gaveta).getByRole('checkbox', { name: 'PJ' }));
    expect(within(gaveta).getByText('Abre direto em PJ.')).toBeInTheDocument();
    expect(within(gaveta).queryByText(/Sem empresa, a pessoa entra/)).toBeNull();
    await user.click(within(gaveta).getByRole('checkbox', { name: 'Cliente Demo' }));
    expect(within(gaveta).getByText(/Escolhe entre 2 empresas/)).toBeInTheDocument();

    await user.click(within(gaveta).getByRole('radio', { name: /^Admin BORD/ }));
    expect(
      within(gaveta).getByText('Admin BORD vê todas as empresas. Não precisa de vínculo.'),
    ).toBeInTheDocument();
    expect(within(gaveta).queryByRole('checkbox')).toBeNull();
    expect(within(gaveta).getByRole('button', { name: '24 h' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(gaveta).getByRole('button', { name: 'Salvar alterações' }));
    expect(salvar).toHaveBeenCalledWith('0d000000-0000-4000-8000-0000000000e0', {
      nome: 'Joana Ribeiro',
      perfil: 'admin',
      clientes: [],
      sessaoMinutos: 1440,
    });
    expect(await within(gaveta).findByRole('alert')).toHaveTextContent('Admin BORD só com e-mail da BORD.');

    // Esc fecha e devolve o foco a quem abriu
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Editar Joana Ribeiro' })).toHaveFocus();
  });

  it('gaveta: salvar grava e fecha, com a lista atualizada', async () => {
    const { api, user } = abrir('/gestao/usuarios');
    const salvar = vi.spyOn(api.gestao, 'salvarUsuario');
    await user.click(await screen.findByRole('button', { name: 'Editar Joana Ribeiro' }));
    const gaveta = screen.getByRole('dialog');
    await user.click(within(gaveta).getByRole('checkbox', { name: 'Restaurante Sabor do Mar' }));
    await user.click(within(gaveta).getByRole('radio', { name: /^Cliente principal/ }));
    await user.click(within(gaveta).getByRole('button', { name: '8 h' }));
    await user.click(within(gaveta).getByRole('button', { name: 'Salvar alterações' }));

    expect(salvar).toHaveBeenCalledWith('0d000000-0000-4000-8000-0000000000e0', {
      nome: 'Joana Ribeiro',
      perfil: 'cliente_principal',
      clientes: ['sabor-do-mar'],
      sessaoMinutos: 480,
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const linha = screen.getByText('joana@sabordomar.com.br').closest('tr')!;
    expect(within(linha).getByText('Abre direto em Restaurante Sabor do Mar')).toBeInTheDocument();
    expect(within(linha).getByText('Ativo')).toBeInTheDocument();
  });

  it('gaveta: desativar e reativar o acesso; o último Admin BORD não tem "Desativar acesso"', async () => {
    const { api, user } = abrir('/gestao/usuarios');
    const acesso = vi.spyOn(api.gestao, 'salvarAcessoDoUsuario');

    await user.click(await screen.findByRole('button', { name: 'Editar Dora' }));
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Desativar acesso' })).toBeNull();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

    await user.click(screen.getByRole('button', { name: 'Editar Caio' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar acesso' }));
    expect(acesso).toHaveBeenCalledWith('0d000000-0000-4000-8000-0000000000c0', false);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const linha = screen.getByText('caio@bord.com.br').closest('tr')!;
    expect(within(linha).getByText('Desativado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar Caio' }));
    const gaveta = screen.getByRole('dialog');
    expect(within(gaveta).queryByRole('button', { name: 'Desativar acesso' })).toBeNull();
    await user.click(within(gaveta).getByRole('button', { name: 'Reativar acesso' }));
    expect(acesso).toHaveBeenLastCalledWith('0d000000-0000-4000-8000-0000000000c0', true);
    expect(await within(gaveta).findByText('Acesso reativado.')).toBeInTheDocument();
    expect(await within(gaveta).findByRole('button', { name: 'Desativar acesso' })).toBeInTheDocument();
  });
});
