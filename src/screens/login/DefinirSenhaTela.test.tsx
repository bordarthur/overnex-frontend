import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { criarAuthFake, LINK_VENCIDO_FAKE } from '../../auth/authFake';
import { renderizarApp } from '../../test/renderizar';

const abrir = (rota: string) => renderizarApp(rota, undefined, undefined, criarAuthFake());

async function salvar(senha: string, repetir: string | null = senha) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Senha nova'), senha);
  if (repetir !== null) await user.type(screen.getByLabelText('Repita a senha'), repetir);
  await user.click(screen.getByRole('button', { name: 'Salvar senha' }));
}

describe('Definir senha', () => {
  it('sem token no link, mostra que o link não vale mais', async () => {
    abrir('/definir-senha?type=invite');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Este link não vale mais' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir um link novo' })).toHaveAttribute(
      'href',
      '/esqueci-senha',
    );
  });

  it('convite: cria o acesso só com a senha, sem repetir', async () => {
    const user = userEvent.setup();
    abrir('/definir-senha?token_hash=abc&type=invite');
    expect(await screen.findByRole('heading', { level: 1, name: 'Crie seu acesso' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Repita a senha')).toBeNull();

    await user.type(screen.getByLabelText('Crie uma senha'), 'Segredo123');
    await user.click(screen.getByRole('button', { name: 'Criar acesso' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Vendas' })).toBeInTheDocument();
  });

  it('os requisitos acendem enquanto a pessoa digita', async () => {
    const user = userEvent.setup();
    abrir('/definir-senha?token_hash=abc&type=recovery');
    const senha = await screen.findByLabelText('Senha nova');
    const requisito = (nome: string) => screen.getByText(nome).closest('li')!;

    await user.type(senha, 'abcdefgh');
    expect(requisito('Pelo menos 8 caracteres')).toHaveClass('atende');
    expect(requisito('Uma letra maiúscula')).not.toHaveClass('atende');

    await user.type(senha, 'A1');
    expect(requisito('Uma letra maiúscula')).toHaveClass('atende');
    expect(requisito('Um número')).toHaveClass('atende');
  });

  it('barra senha sem os requisitos e senhas diferentes antes de chamar a API', async () => {
    abrir('/definir-senha?token_hash=abc&type=recovery');
    await salvar('fraca', 'fraca');
    expect(screen.getByRole('alert')).toHaveTextContent('A senha ainda não cumpre os três requisitos.');

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Senha nova'));
    await user.clear(screen.getByLabelText('Repita a senha'));
    await salvar('Segredo123', 'Segredo124');
    expect(screen.getByRole('alert')).toHaveTextContent('As duas senhas estão diferentes.');
  });

  it('link recusado pela API (410) mostra que o link não vale mais', async () => {
    abrir(`/definir-senha?token_hash=${LINK_VENCIDO_FAKE}&type=recovery`);
    await salvar('Segredo123');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Este link não vale mais' }),
    ).toBeInTheDocument();
  });

  it('com a senha salva, entra direto na tela do cliente', async () => {
    abrir('/definir-senha?token_hash=abc&type=recovery');
    await salvar('Segredo123');
    expect(await screen.findByRole('heading', { level: 3, name: 'Vendas' })).toBeInTheDocument();
  });
});
