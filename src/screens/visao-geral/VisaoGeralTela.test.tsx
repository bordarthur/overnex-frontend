import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { VisaoGeralPayload } from '../../contracts/visaoGeral';
import fixtureModulo from '../../test/fixtures/visao-geral-modulo.json';
import { renderizarApp } from '../../test/renderizar';

const contagemDa = (secao: string) =>
  within(screen.getByRole('region', { name: secao })).getByTestId('contagem-status');

describe('Visão geral', () => {
  it('desenha exatamente as 4 seções da fixture, na ordem, sem etiqueta de módulo', async () => {
    renderizarApp('/demo/visao-geral');
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });

    const titulos = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual(['Vendas', 'Custos', 'Resultado', 'Financeiro']);
    expect(screen.queryAllByTestId('etiqueta-modulo')).toHaveLength(0);
    expect(screen.queryByText(/Módulo/)).toBeNull();

    // Fora do escopo universal.
    expect(screen.queryByText('Prazo de pagamento a fornecedores')).toBeNull();
    expect(screen.queryByText('Vencido a receber')).toBeNull();
    expect(
      screen.getAllByRole('article', { name: /./ }).filter((a) => a.classList.contains('ftile')),
    ).toHaveLength(16);
    expect(screen.getByRole('heading', { level: 2, name: /Inadimplência/ })).toBeInTheDocument();
  });

  it('trocar o período muda valor, status e ponteiro do indicador e a contagem da faixa', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral');
    const indicador = await screen.findByRole('article', { name: 'Linhas por cliente' });

    expect(within(indicador).getByText('2,3 linhas')).toBeInTheDocument();
    expect(within(indicador).getByText('Crítico')).toBeInTheDocument();
    expect(within(contagemDa('Vendas')).getByText('1 crítico')).toBeInTheDocument();
    expect(within(contagemDa('Vendas')).getByText('2 atenção')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Acumulado 2026' }));

    expect(screen.getByRole('button', { name: 'Acumulado 2026' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(indicador).getByText('2,4 linhas')).toBeInTheDocument();
    expect(within(indicador).getByText('Atenção')).toBeInTheDocument();
    expect(within(indicador).queryByText('Crítico')).toBeNull();
    expect(
      within(indicador).getByRole('img', {
        name: 'Linhas por cliente: 2,4 linhas, média do ano contra meta de 2,6',
      }),
    ).toBeInTheDocument();
    expect(within(contagemDa('Vendas')).queryByText(/crítico/)).toBeNull();
    expect(within(contagemDa('Vendas')).getByText('3 atenção')).toBeInTheDocument();
    expect(within(contagemDa('Vendas')).getByText('1 saudável')).toBeInTheDocument();
  });

  it('mostra "na média" quando o delta é zero', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral');
    const indicador = await screen.findByRole('article', { name: 'Ciclo de caixa' });
    await user.click(screen.getByRole('button', { name: 'Acumulado 2026' }));
    expect(within(indicador).getByText('na média')).toBeInTheDocument();
  });

  it('mostra a etiqueta quando a seção vem com módulo', async () => {
    renderizarApp('/demo/visao-geral', fixtureModulo as unknown as VisaoGeralPayload);
    const etiqueta = await screen.findByTestId('etiqueta-modulo');
    expect(etiqueta).toHaveTextContent('Módulo Distribuidora');
    expect(screen.getByRole('heading', { level: 3, name: 'Seção de teste' })).toBeInTheDocument();
  });

  it('avisa quando não há acesso ao cliente', async () => {
    renderizarApp('/outro-cliente/visao-geral');
    expect(
      await screen.findByText('Você não tem acesso a esta tela. Fale com o gestor do seu painel.'),
    ).toBeInTheDocument();
  });

  it('avisa quando não há dados', async () => {
    renderizarApp('/vazio/visao-geral');
    expect(await screen.findByText('Ainda não há dados para este período.')).toBeInTheDocument();
  });

  it('o chip de filtro abre um menu navegável por teclado e só troca o rótulo', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral');
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });

    const chip = screen.getByRole('button', { name: /Comparar com/ });
    await user.click(chip);
    const menu = screen.getByRole('menu', { name: 'Comparar com' });
    expect(within(menu).getByRole('menuitemradio', { name: 'Orçado' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(within(menu).getByRole('menuitemradio', { name: 'Mês anterior' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(chip).toHaveFocus();
    expect(chip).toHaveTextContent('Mês anterior');
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });
});
