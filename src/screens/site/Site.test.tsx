import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Raiz } from '../../app/Raiz';
import { criarAuthFake } from '../../auth/authFake';
import { renderizarApp } from '../../test/renderizar';
import { CONTEUDO } from './conteudo';
import { acumular, projetar } from './farol';

// Carregados antes, para o primeiro teste não depender do tempo da carga sob demanda (ver Raiz.tsx).
beforeAll(async () => {
  await Promise.all([import('./Landing'), import('./Privacidade')]);
});

afterEach(() => vi.restoreAllMocks());

const abrir = (rota: string) =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Raiz app={<p>o app</p>} />
    </MemoryRouter>,
  );

describe('site institucional', () => {
  it('"/" abre a landing, fora do app, sem chamar a API', async () => {
    const rede = vi.spyOn(globalThis, 'fetch');
    abrir('/');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Veja para onde sua empresa está indo. Antes do fim do mês.',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('o app')).toBeNull();
    expect(document.title).toBe('Overnex · Seu farol de decisões');
    expect(rede).not.toHaveBeenCalled();
  });

  it('Entrar leva ao login do app; a chamada abre o WhatsApp; o rodapé leva à privacidade', async () => {
    abrir('/');
    const topo = await screen.findByRole('banner');

    expect(within(topo).getAllByRole('link', { name: 'Entrar' })[0]).toHaveAttribute('href', '/entrar');
    const demo = within(topo).getByRole('link', { name: 'Agendar demonstração' });
    expect(demo).toHaveAttribute(
      'href',
      `https://wa.me/5585997440016?text=${encodeURIComponent(CONTEUDO.contato.mensagem)}`,
    );
    expect(demo).toHaveAttribute('target', '_blank');
    const rodape = within(screen.getByRole('navigation', { name: 'Rodapé' }));
    expect(rodape.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade');
  });

  it('o menu do celular abre e fecha', async () => {
    const user = userEvent.setup();
    abrir('/');
    const botao = await screen.findByRole('button', { name: 'Abrir menu' });

    await user.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(botao).toHaveAccessibleName('Fechar menu');
    await user.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });

  it('o farol: arrastar o dia muda a projeção, o status e a frase', async () => {
    abrir('/');
    const dia = await screen.findByRole('slider', { name: 'Dia do mês' });
    const cartao = screen.getByText('Vendas contra a meta · projeção').parentElement!;

    // dia 13: 94,8%, atenção, faltando R$ 337 mil por dia útil
    expect(dia).toHaveValue('13');
    expect(within(cartao).getByText('94,8%')).toBeInTheDocument();
    expect(within(cartao).getByText('Atenção')).toBeInTheDocument();
    expect(cartao).toHaveTextContent('você fecha R$ 360 mil abaixo da meta. Faltam R$ 337 mil por dia útil.');

    fireEvent.change(dia, { target: { value: '1' } });
    expect(within(cartao).getByText('Saudável')).toBeInTheDocument();
    expect(cartao).toHaveTextContent('acima da meta');

    fireEvent.change(dia, { target: { value: '22' } });
    expect(cartao).toHaveTextContent('Mês fechado em R$ 6,11 mi, R$ 786 mil abaixo da meta.');
    expect(screen.getByText('22 de 22')).toBeInTheDocument();
  });

  it('setores: as abas trocam o painel, pelo clique e pelas setas', async () => {
    const user = userEvent.setup();
    abrir('/');
    const geral = await screen.findByRole('tab', { name: 'Visão geral' });
    expect(geral).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Visão geral' })).toHaveTextContent('Contas a pagar acima');

    await user.click(screen.getByRole('tab', { name: 'Comercial' }));
    const comercial = screen.getByRole('tabpanel', { name: 'Comercial' });
    expect(comercial).toHaveTextContent('Vendedor A');
    expect(within(comercial).getByRole('img', { name: 'Vendas contra a meta: 94,8%' })).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Financeiro' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Financeiro' })).toHaveTextContent('Entra em 30 dias');
  });

  it('a pergunta marcada para não aparecer fica de fora', async () => {
    abrir('/');
    expect(await screen.findByText('Preciso trocar meu sistema?')).toBeInTheDocument();
    expect(screen.queryByText('Funciona para mais de uma empresa?')).toBeNull();
  });

  it('"/privacidade" abre a política, com o contato e a volta para o início', async () => {
    abrir('/privacidade');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Política de privacidade' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONTEUDO.contato.email })).toHaveAttribute(
      'href',
      `mailto:${CONTEUDO.contato.email}`,
    );
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Overnex · Política de privacidade');
  });

  it('o resto dos endereços é do app', () => {
    abrir('/entrar');
    expect(screen.getByText('o app')).toBeInTheDocument();
  });
});

describe('site e app', () => {
  it('a seção de segurança só traz o que já vale', async () => {
    abrir('/');
    const lista = within(
      (await screen.findByRole('heading', { level: 2, name: 'Seus números são só seus.' })).closest(
        'section',
      )!,
    );
    expect(lista.getByText('Dados armazenados no Brasil.')).toBeInTheDocument();
    expect(lista.queryByText(/LGPD/)).toBeNull();
  });

  it('o login leva à política de privacidade e fica fora dos buscadores', async () => {
    renderizarApp('/entrar', undefined, undefined, criarAuthFake());
    expect(await screen.findByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});

describe('contas do farol', () => {
  const acumulado = acumular(CONTEUDO.farol.vendas);
  const { diasUteis, meta } = CONTEUDO.farol;

  it('no dia 13, a projeção do hero: R$ 6,54 mi, 94,8% da meta, atenção', () => {
    const p = projetar(acumulado, 13, diasUteis, meta);
    expect(p.vendido).toBe(3864.5);
    expect(p.projecao).toBeCloseTo(6539.96, 1);
    expect(p.pct).toBeCloseTo(94.78, 2);
    expect(p.status).toBe('atencao');
    expect(p.faltaPorDia).toBeCloseTo(337.28, 2);
  });

  it('no começo do mês o ritmo passa da meta; no último dia não falta nada por dia', () => {
    expect(projetar(acumulado, 1, diasUteis, meta).status).toBe('saudavel');
    const fim = projetar(acumulado, 22, diasUteis, meta);
    expect(fim.vendido).toBe(6114.5);
    expect(fim.faltaPorDia).toBe(0);
    expect(fim.status).toBe('critico');
  });
});
