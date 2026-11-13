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
    // o atalho para os painéis é um botão (link) no cabeçalho
    expect(screen.getByRole('link', { name: 'Abrir os painéis desta empresa' })).toHaveAttribute(
      'href',
      '/pj',
    );
  });

  it('convidar pelo cabeçalho da empresa: ela já vem marcada, e o passo final mostra o texto da API', async () => {
    const { api, user } = abrir('/gestao/empresas/pj');
    const convidar = vi.spyOn(api.gestao, 'convidarUsuario');
    await screen.findByRole('heading', { level: 1, name: 'PJ' });

    await user.click(screen.getByRole('button', { name: 'Convidar usuário' }));
    const gaveta = screen.getByRole('dialog', { name: 'Convidar usuário' });
    expect(within(gaveta).getByLabelText('E-mail')).toHaveFocus();
    expect(within(gaveta).getByRole('checkbox', { name: 'PJ' })).toBeChecked();
    expect(within(gaveta).getByText('Abre direto em PJ.')).toBeInTheDocument();
    expect(await within(gaveta).findByText(/A pessoa recebe o convite por e-mail/)).toBeInTheDocument();
    // o tempo de sessão só aparece com o perfil escolhido
    expect(within(gaveta).queryByRole('group', { name: 'A sessão cai após' })).toBeNull();

    // nada escolhido: não chama a API e diz o que falta
    await user.click(within(gaveta).getByRole('button', { name: 'Enviar convite' }));
    expect(convidar).not.toHaveBeenCalled();
    expect(within(gaveta).getByText('Informe o e-mail.')).toBeInTheDocument();
    expect(within(gaveta).getByText('Informe o nome.')).toBeInTheDocument();
    expect(within(gaveta).getByText('Escolha o perfil.')).toBeInTheDocument();

    await user.type(within(gaveta).getByLabelText('E-mail'), 'ana@pj.com.br');
    await user.type(within(gaveta).getByLabelText('Nome'), 'Ana Souza');
    await user.click(within(gaveta).getByRole('radio', { name: /^Cliente usuário/ }));
    await user.click(within(gaveta).getByRole('button', { name: 'Enviar convite' }));
    expect(convidar).toHaveBeenCalledTimes(1);
    expect(convidar.mock.calls[0]![0]).toMatchObject({
      email: 'ana@pj.com.br',
      nome: 'Ana Souza',
      perfil: 'cliente_usuario',
      clientes: ['pj'],
    });
    expect(await within(gaveta).findByText('Convite na fila: sai em instantes.')).toBeInTheDocument();
    expect(within(gaveta).getByText('ana@pj.com.br')).toBeInTheDocument();

    await user.click(within(gaveta).getByRole('button', { name: 'Concluir' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    // a pessoa nova entra na lista da empresa, com o convite na fila
    await user.click(screen.getByRole('tab', { name: 'Usuários e acesso' }));
    const linha = (await screen.findByText('ana@pj.com.br')).closest('tr')!;
    expect(within(linha).getByText('Convite na fila')).toBeInTheDocument();
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
    // quem acessa: o Admin BORD não aparece; o convite fica no cabeçalho da empresa e no cartão
    expect(screen.queryByText('dora@bord.com.br')).toBeNull();
    expect(screen.getByRole('button', { name: 'Convidar usuário' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convidar para Cliente Demo' })).toBeInTheDocument();
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

  it('nova empresa: cria, mostra o texto da API e abre a empresa; a recusa aparece como veio', async () => {
    const { api, user } = abrir('/gestao/empresas/pj');
    const criar = vi.spyOn(api.gestao, 'criarCliente');
    await screen.findByRole('heading', { level: 1, name: 'PJ' });
    // o setor aparece na barra lateral, quando há
    const lista = screen.getByRole('navigation', { name: 'Empresas' });
    expect(within(lista).getByRole('link', { name: /^Agência Aurora/ })).toHaveTextContent('Publicidade');

    await user.click(screen.getByRole('button', { name: 'Nova empresa' }));
    const gaveta = screen.getByRole('dialog', { name: 'Nova empresa' });
    await user.click(within(gaveta).getByRole('button', { name: 'Criar empresa' }));
    expect(criar).not.toHaveBeenCalled();
    expect(within(gaveta).getByText('Informe o nome da empresa.')).toBeInTheDocument();

    // identificador que já existe (o da PJ)
    await user.type(within(gaveta).getByLabelText('Nome'), 'PJ');
    await user.click(within(gaveta).getByRole('button', { name: 'Criar empresa' }));
    expect(await within(gaveta).findByRole('alert')).toHaveTextContent(
      'Já existe uma empresa com o identificador pj.',
    );

    await user.clear(within(gaveta).getByLabelText('Nome'));
    await user.type(within(gaveta).getByLabelText('Nome'), 'Padaria São João');
    await user.type(within(gaveta).getByLabelText('Setor'), 'Alimentação');
    await user.click(within(gaveta).getByRole('button', { name: 'Criar empresa' }));
    expect(criar).toHaveBeenLastCalledWith({ nome: 'Padaria São João', segmento: 'Alimentação', slug: null });
    expect(await within(gaveta).findByText(/^Empresa criada\./)).toBeInTheDocument();

    await user.click(within(gaveta).getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Padaria São João' })).toBeInTheDocument();
    expect(screen.getByText('0 de 4 camadas ativas')).toBeInTheDocument();
    expect(within(lista).getByRole('link', { name: /^Padaria São João/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // o convite já funciona na empresa nova
    await user.click(screen.getByRole('tab', { name: 'Usuários e acesso' }));
    expect(screen.getByRole('button', { name: 'Convidar para Padaria São João' })).toBeInTheDocument();
  });

  it('editar empresa: troca o nome e o setor, sem campo de identificador; a recusa da API aparece', async () => {
    const { api, user } = abrir('/gestao/empresas/pj');
    const salvar = vi.spyOn(api.gestao, 'salvarCliente');
    await screen.findByRole('heading', { level: 1, name: 'PJ' });

    await user.click(screen.getByRole('button', { name: 'Editar empresa' }));
    const gaveta = screen.getByRole('dialog', { name: 'Editar empresa' });
    expect(within(gaveta).getByLabelText('Nome')).toHaveValue('PJ');
    // empresa sem setor: campo vazio, e nada no cabeçalho
    expect(within(gaveta).getByLabelText('Setor')).toHaveValue('');
    expect(within(gaveta).getAllByRole('textbox')).toHaveLength(2);

    await user.clear(within(gaveta).getByLabelText('Nome'));
    await user.click(within(gaveta).getByRole('button', { name: 'Salvar alterações' }));
    expect(salvar).not.toHaveBeenCalled();
    expect(within(gaveta).getByText('Informe o nome da empresa.')).toBeInTheDocument();

    await user.type(within(gaveta).getByLabelText('Nome'), 'PJ Cortes');
    await user.type(within(gaveta).getByLabelText('Setor'), 'Frigorífico');
    salvar.mockRejectedValueOnce(new ApiErro(404, 'Empresa não encontrada.'));
    await user.click(within(gaveta).getByRole('button', { name: 'Salvar alterações' }));
    expect(await within(gaveta).findByRole('alert')).toHaveTextContent('Empresa não encontrada.');

    await user.click(within(gaveta).getByRole('button', { name: 'Salvar alterações' }));
    expect(salvar).toHaveBeenLastCalledWith('pj', { nome: 'PJ Cortes', segmento: 'Frigorífico' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByRole('heading', { level: 1, name: 'PJ Cortes' })).toBeInTheDocument();
    // o setor aparece no cabeçalho e na barra lateral
    expect(screen.getAllByText('Frigorífico')).toHaveLength(2);
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
    expect(await screen.findByText('13 de 13 pessoas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convidar usuário' })).toBeInTheDocument();

    const filtros = screen.getByRole('navigation', { name: 'Filtros de pessoas' });
    await user.click(within(filtros).getByRole('link', { name: /Convites pendentes/ }));
    expect(linhas().map((l) => within(l).getAllByRole('cell')[0]!.textContent)).toEqual([
      'Financeiro PJfinanceiro@pj.com.br',
      'Gerente da lojaloja@sabordomar.com.br',
      'Sócio da Aurorasocio@agenciaaurora.com.br',
    ]);

    await user.click(screen.getByRole('button', { name: /^Consultor por carteira/ }));
    expect(screen.getByText('2 de 13 pessoas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Consultor por carteira/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: /^Consultor por carteira/ }));
    expect(screen.getByText('13 de 13 pessoas')).toBeInTheDocument();

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

  it('convidar: a recusa da API aparece como veio; depois do convite, dá para convidar outra pessoa', async () => {
    const { api, user } = abrir('/gestao/usuarios');
    const convidar = vi.spyOn(api.gestao, 'convidarUsuario');
    await user.click(await screen.findByRole('button', { name: 'Convidar usuário' }));
    const gaveta = screen.getByRole('dialog', { name: 'Convidar usuário' });
    expect(within(gaveta).queryByRole('checkbox', { checked: true })).toBeNull();

    // e-mail que já existe
    await user.type(within(gaveta).getByLabelText('E-mail'), 'Caio@bord.com.br');
    await user.type(within(gaveta).getByLabelText('Nome'), 'Outro Caio');
    await user.click(within(gaveta).getByRole('radio', { name: /^Admin BORD/ }));
    expect(within(gaveta).queryByRole('checkbox')).toBeNull();
    await user.click(within(gaveta).getByRole('button', { name: 'Enviar convite' }));
    expect(await within(gaveta).findByRole('alert')).toHaveTextContent(
      'Este e-mail já tem cadastro no Overnex.',
    );

    await user.clear(within(gaveta).getByLabelText('E-mail'));
    await user.type(within(gaveta).getByLabelText('E-mail'), 'bia@bord.com.br');
    await user.click(within(gaveta).getByRole('button', { name: 'Enviar convite' }));
    expect(convidar).toHaveBeenLastCalledWith({
      email: 'bia@bord.com.br',
      nome: 'Outro Caio',
      perfil: 'admin',
      clientes: [],
      sessaoMinutos: 1440,
    });
    expect(await within(gaveta).findByText('Convite na fila: sai em instantes.')).toBeInTheDocument();

    // volta ao formulário, sem o nome e o e-mail e com o perfil mantido
    await user.click(within(gaveta).getByRole('button', { name: 'Convidar outra pessoa' }));
    expect(within(gaveta).getByLabelText('E-mail')).toHaveValue('');
    expect(within(gaveta).getByLabelText('Nome')).toHaveValue('');
    expect(within(gaveta).getByRole('radio', { name: /^Admin BORD/ })).toBeChecked();
    await user.keyboard('{Escape}');
    expect(await screen.findByText('14 de 14 pessoas')).toBeInTheDocument();
  });

  it('gaveta: quem ainda não entrou tem o botão de mandar o convite de novo, com o rótulo da API', async () => {
    const { api, user } = abrir('/gestao/usuarios');
    const reenviar = vi.spyOn(api.gestao, 'reenviarConvite');
    await user.click(await screen.findByRole('button', { name: 'Editar Gerente da loja' }));
    const gaveta = screen.getByRole('dialog', { name: 'Gerente da loja' });

    await user.click(within(gaveta).getByRole('button', { name: 'Reenviar convite' }));
    expect(reenviar).toHaveBeenCalledWith('0d000000-0000-4000-8000-0000000001d1');
    expect(await within(gaveta).findByText('Convite na fila: sai em instantes.')).toBeInTheDocument();
    // com o convite na fila, a API não oferece mais o botão
    await waitFor(() =>
      expect(within(gaveta).queryByRole('button', { name: 'Reenviar convite' })).toBeNull(),
    );
    await user.keyboard('{Escape}');
    const linha = screen.getByText('loja@sabordomar.com.br').closest('tr')!;
    expect(within(linha).getByText('Convite na fila')).toBeInTheDocument();
  });

  it('convite que não saiu: a linha mostra o motivo e o botão "Tentar de novo", que pede de novo', async () => {
    const { api, user } = abrir('/gestao/usuarios');
    const reenviar = vi.spyOn(api.gestao, 'reenviarConvite');
    const linha = (await screen.findByText('socio@agenciaaurora.com.br')).closest('tr')!;
    expect(within(linha).getByText('Convite não enviado')).toBeInTheDocument();
    expect(within(linha).getByText('O serviço de e-mail recusou o endereço.')).toBeInTheDocument();
    // quem já entrou não tem o botão
    expect(screen.queryByRole('button', { name: /: Caio$/ })).toBeNull();

    await user.click(within(linha).getByRole('button', { name: 'Tentar de novo: Sócio da Aurora' }));
    expect(reenviar).toHaveBeenCalledWith('0d000000-0000-4000-8000-0000000001c2');
    await waitFor(() => expect(within(linha).getByText('Convite na fila')).toBeInTheDocument());
    expect(within(linha).queryByRole('button', { name: /Tentar de novo/ })).toBeNull();
    expect(within(linha).queryByText('O serviço de e-mail recusou o endereço.')).toBeNull();
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
