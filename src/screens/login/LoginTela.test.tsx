import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { criarMockClient } from '../../api/mockClient';
import { AuthContext, type Auth } from '../../auth/auth';
import { criarAuthFake, SENHA_BLOQUEADA_FAKE, SENHA_ERRADA_FAKE } from '../../auth/authFake';
import { renderizarApp } from '../../test/renderizar';
import { LoginTela } from './LoginTela';

const semSessao = (rota: string) => renderizarApp(rota, undefined, undefined, criarAuthFake());

async function entrar(senha = 'segredo123', email = 'ana@cliente.com.br') {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('E-mail'), email);
  await user.type(screen.getByLabelText('Senha'), senha);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  return user;
}

describe('Login', () => {
  it('sem sessão, a tela protegida manda para o login e volta para ela depois de entrar', async () => {
    semSessao('/demo/visao-geral');
    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();

    await entrar();

    expect(await screen.findByRole('heading', { level: 3, name: 'Vendas' })).toBeInTheDocument();
  });

  it('mostra o erro que a API mandou e continua no login', async () => {
    semSessao('/entrar');
    await entrar(SENHA_ERRADA_FAKE);

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha não conferem.');
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true');
  });

  it('confere o e-mail antes de chamar a API', async () => {
    semSessao('/entrar');
    await entrar('segredo123', 'ana@cliente');

    expect(screen.getByRole('alert')).toHaveTextContent('Digite um e-mail completo');
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
  });

  it('tentativas demais (429) pausam o acesso, com o tempo que a API mandou', async () => {
    semSessao('/entrar');
    const user = await entrar(SENHA_BLOQUEADA_FAKE);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acesso pausado por segurança' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Foram 5 tentativas/)).toHaveTextContent('15:00');

    await user.click(screen.getByRole('button', { name: 'Voltar para entrar' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('ignora um "voltar" para outro site e abre a tela do cliente da sessão', async () => {
    semSessao('/entrar?voltar=%2F%2Fexemplo.com');
    await entrar();
    expect(await screen.findByRole('heading', { level: 3, name: 'Vendas' })).toBeInTheDocument();
  });

  it('com sessão aberta, /entrar leva para a tela do cliente', async () => {
    renderizarApp('/entrar');
    expect(await screen.findByRole('heading', { level: 3, name: 'Vendas' })).toBeInTheDocument();
  });

  it('mostra o usuário no rail e Sair volta para o login', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral');
    const rail = await screen.findByRole('complementary', { name: 'Navegação' });
    expect(within(rail).getByText('Usuário de desenvolvimento')).toBeInTheDocument();

    await user.click(within(rail).getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('sem permissão, oferece entrar com outra conta', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral', undefined, criarMockClient({ atrasoMs: 0, cenario: 'sem-permissao' }));
    await user.click(await screen.findByRole('button', { name: 'Entrar com outra conta' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('esqueci a senha responde igual para qualquer e-mail', async () => {
    const user = userEvent.setup();
    semSessao('/entrar');
    await user.click(await screen.findByRole('link', { name: 'Esqueci a senha' }));
    await user.type(screen.getByLabelText('E-mail'), 'qualquer@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Confira seu e-mail' })).toBeInTheDocument();
    expect(screen.getByText(/tiver acesso ao Overnex/)).toHaveTextContent('qualquer@exemplo.com');
    expect(screen.getByText(/Reenviar em/)).toBeInTheDocument();
  });
});

describe('Sessão encerrada', () => {
  function renderizar() {
    const entrar = vi.fn<Auth['entrar']>(async () => {});
    const auth: Auth = {
      estado: 'anonimo',
      usuario: null,
      saiu: false,
      sessaoEncerrada: { nome: 'Ana Souza', email: 'ana@cliente.com.br' },
      getToken: async () => null,
      renovarToken: async () => null,
      entrar,
      esqueciSenha: async () => {},
      definirSenha: async () => {},
      sair: async () => {},
    };
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth}>
          <LoginTela />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    return entrar;
  }

  it('pede só a senha da mesma conta', async () => {
    const user = userEvent.setup();
    const entrar = renderizar();
    expect(screen.getByRole('heading', { level: 1, name: 'Sua sessão terminou' })).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.queryByLabelText('E-mail')).toBeNull();

    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(entrar).toHaveBeenCalledWith('ana@cliente.com.br', 'segredo123');
  });

  it('"Entrar com outra conta" volta ao formulário completo', async () => {
    const user = userEvent.setup();
    renderizar();
    await user.click(screen.getByRole('button', { name: 'Entrar com outra conta' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });
});
