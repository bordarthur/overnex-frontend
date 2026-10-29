import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiErro } from '../../api/client';
import { criarMockClient, fixtureSessao, fixtureVisaoGeral } from '../../api/mockClient';
import type { CartaoProximosDias, VisaoGeralPayload } from '../../contracts/visaoGeral';
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
    // 4 de Vendas, 6 de Custos (Automático) e 4 de Resultado; o Financeiro só tem cartões
    expect(
      screen.getAllByRole('article', { name: /./ }).filter((a) => a.classList.contains('ftile')),
    ).toHaveLength(14);
    const financeiro = screen.getByRole('region', { name: 'Financeiro' });
    expect(
      within(financeiro)
        .queryAllByRole('article')
        .filter((a) => a.classList.contains('ftile')),
    ).toHaveLength(0);
    expect(
      within(financeiro)
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent),
    ).toEqual([
      'Próximos 7, 15 e 30 dias Saudável',
      'Contas a pagar lançadas Atenção',
      'Inadimplência corrente Atenção',
    ]);
    expect(
      screen.getByText('Cada cartão tem a própria chave Mês/Acumulado.', { exact: false }),
    ).toBeInTheDocument();
  });

  it('cada velocímetro tem a própria chave Mês/Acumulado, e a faixa conta pela chave de cada um', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral');
    const bovinos = await screen.findByRole('article', { name: 'CMV de bovinos' });
    const aves = screen.getByRole('article', { name: 'CMV de aves' });

    expect(within(bovinos).getByText('72,9%', { selector: '.ft-val' })).toBeInTheDocument();
    expect(within(bovinos).getByText('Crítico')).toBeInTheDocument();
    expect(within(contagemDa('Custos')).getByText('1 crítico')).toBeInTheDocument();
    expect(within(contagemDa('Custos')).getByText('3 atenção')).toBeInTheDocument();
    expect(within(contagemDa('Custos')).getByText('2 saudável')).toBeInTheDocument();

    const chave = within(bovinos).getByRole('group', { name: 'Período do cartão CMV de bovinos' });
    await user.click(within(chave).getByRole('button', { name: 'Acumulado' }));

    expect(within(chave).getByRole('button', { name: 'Acumulado' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(bovinos).getByText('71,4%', { selector: '.ft-val' })).toBeInTheDocument();
    expect(within(bovinos).getByText('Atenção')).toBeInTheDocument();
    expect(
      within(bovinos).getByRole('img', {
        name: 'CMV de bovinos: 71,4%, acumulado, contra 70,0% orçado · R$ 1,60 mi de custo no mês',
      }),
    ).toBeInTheDocument();
    // os outros cartões continuam no Mês
    expect(within(aves).getByText('66,0%', { selector: '.ft-val' })).toBeInTheDocument();
    expect(within(contagemDa('Custos')).queryByText(/crítico/)).toBeNull();
    expect(within(contagemDa('Custos')).getByText('4 atenção')).toBeInTheDocument();
  });

  it('mostra o delta com a seta do sinal, ou o texto pronto que veio da API', async () => {
    renderizarApp('/demo/visao-geral');
    const meta = await screen.findByRole('article', { name: 'Vendas contra a meta' });
    // a seta vai num span à parte, escondido do leitor de tela
    const delta = meta.querySelector('.ft-delta');
    expect(delta).toHaveTextContent('▼ −R$ 360 mil');
    expect(delta).toHaveClass('t-crit');
    const pedidos = screen.getByRole('article', { name: 'Pedidos por cliente' });
    expect(within(pedidos).getByText('na meta')).toHaveClass('t-ok');
  });

  it('"Ver painel" leva à tela do indicador; sem a tela no front, não há link', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral');
    const ticket = await screen.findByRole('article', { name: 'Ticket por pedido' });
    // Dívida líquida / EBITDA aponta para "caixa", que ainda não existe
    expect(
      within(screen.getByRole('article', { name: 'Dívida líquida / EBITDA' })).queryByRole('link'),
    ).toBeNull();

    await user.click(within(ticket).getByRole('link', { name: 'Ver painel' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Vendas' })).toBeInTheDocument();
  });

  it('próximos dias: o modo muda o fim de cada janela, a pílula e a contagem do Financeiro', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/visao-geral');
    const cartao = await screen.findByRole('article', { name: /^Próximos 7, 15 e 30 dias/ });

    expect(within(cartao).getAllByText('entra mais do que sai')).toHaveLength(3);
    expect(within(cartao).getByText('R$ 1,60 mi')).toBeInTheDocument();
    expect(within(contagemDa('Financeiro')).getByText('2 atenção')).toBeInTheDocument();
    expect(within(contagemDa('Financeiro')).getByText('1 saudável')).toBeInTheDocument();

    await user.click(within(cartao).getByRole('button', { name: 'Com o que falta lançar' }));

    expect(within(cartao).getAllByText('sai mais do que entra')).toHaveLength(3);
    expect(within(cartao).getByText('−R$ 1,05 mi')).toBeInTheDocument();
    expect(within(cartao).getByRole('heading', { level: 2 })).toHaveTextContent('Atenção');
    expect(
      within(cartao).getByRole('img', {
        name: /^30 dias: A receber R\$ 5,26 mi, A pagar R\$ 3,66 mi, Falta/,
      }),
    ).toBeInTheDocument();
    expect(within(contagemDa('Financeiro')).getByText('3 atenção')).toBeInTheDocument();
    expect(within(contagemDa('Financeiro')).queryByText(/saudável/)).toBeNull();
  });

  it('linhas de custo: a escolha grava na API e a Custos volta com as linhas escolhidas', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const salvar = vi.spyOn(api, 'salvarPreferenciaVisaoGeral');
    renderizarApp('/demo/visao-geral', undefined, api);
    const custos = await screen.findByRole('region', { name: 'Custos' });
    const linhas = within(custos).getByRole('group', { name: 'Linhas de custo' });
    expect(within(linhas).getByRole('button', { name: 'Automático (80%)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(custos).getByRole('article', { name: 'Outros (11 linhas)' })).toBeInTheDocument();

    await user.click(within(linhas).getByRole('button', { name: '3' }));

    // sem empresa escolhida na tela, a gravação vai sem ela
    expect(salvar).toHaveBeenCalledWith('linhas-custo', '3', { empresa: undefined });
    expect(await within(custos).findByRole('article', { name: 'Outros (13 linhas)' })).toBeInTheDocument();
    expect(within(custos).getAllByRole('article')).toHaveLength(4);
    expect(within(linhas).getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('linhas de custo: se a gravação falha, avisa e a escolha volta para a salva', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    vi.spyOn(api, 'salvarPreferenciaVisaoGeral').mockRejectedValue(new Error('falhou'));
    renderizarApp('/demo/visao-geral', undefined, api);
    const linhas = await screen.findByRole('group', { name: 'Linhas de custo' });

    await user.click(within(linhas).getByRole('button', { name: '2' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar a escolha.');
    expect(within(linhas).getByRole('button', { name: 'Automático (80%)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('linhas de custo: a recusa da API (403) mostra o texto dela e volta a escolha', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    vi.spyOn(api, 'salvarPreferenciaVisaoGeral').mockRejectedValue(
      new ApiErro(403, 'Você não pode mudar esta escolha.'),
    );
    renderizarApp('/demo/visao-geral', undefined, api);
    const linhas = await screen.findByRole('group', { name: 'Linhas de custo' });

    await user.click(within(linhas).getByRole('button', { name: '4' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Você não pode mudar esta escolha.');
    expect(within(linhas).getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('linhas de custo: o papel "leitor" vê a escolha, mas não muda', async () => {
    const api = criarMockClient({ atrasoMs: 0, sessao: { ...fixtureSessao, papel: 'leitor' } });
    renderizarApp('/demo/visao-geral', undefined, api);
    const linhas = await screen.findByRole('group', { name: 'Linhas de custo' });
    // a sessão chega junto com a Visão geral; espera o seletor travar
    await waitFor(() => expect(within(linhas).getByRole('button', { name: '3' })).toBeDisabled());
    expect(screen.getByText('Seu perfil não pode mudar esta escolha.')).toBeInTheDocument();
  });

  it('próximos dias com um modo só não mostra a chave de modos', async () => {
    const secoes = fixtureVisaoGeral.secoes.map((s) => ({
      ...s,
      cartoes: s.cartoes.map((c) => {
        if (c.tipo !== 'proximos-dias') return c;
        const so: CartaoProximosDias = {
          ...c,
          modos: c.modos.filter((m) => m.id === 'lancado'),
          janelas: c.janelas.map((j) => ({ ...j, fim: { lancado: j.fim.lancado! } })),
        };
        return so;
      }),
    }));
    renderizarApp('/demo/visao-geral', { ...fixtureVisaoGeral, secoes });
    const cartao = await screen.findByRole('article', { name: /^Próximos 7, 15 e 30 dias/ });
    expect(within(cartao).queryByRole('group', { name: 'Contas a pagar consideradas' })).toBeNull();
    expect(within(cartao).getAllByText('entra mais do que sai')).toHaveLength(3);
  });

  it('mostra a etiqueta quando a seção vem com módulo', async () => {
    renderizarApp('/demo/visao-geral', fixtureModulo as unknown as VisaoGeralPayload);
    const etiqueta = await screen.findByTestId('etiqueta-modulo');
    expect(etiqueta).toHaveTextContent('Módulo Distribuidora');
    expect(screen.getByRole('heading', { level: 3, name: 'Seção de teste' })).toBeInTheDocument();
  });

  it('a grade de velocímetros tem tantas colunas quantos indicadores, até 4', async () => {
    renderizarApp('/demo/visao-geral', fixtureModulo as unknown as VisaoGeralPayload);
    const unico = await screen.findByRole('article', { name: /./ });
    expect(unico.closest('.fgrid')).toHaveClass('n-1');

    cleanup();
    renderizarApp('/demo/visao-geral');
    const vendas = await screen.findByRole('article', { name: 'Pedidos por cliente' });
    expect(vendas.closest('.fgrid')).toHaveClass('n-4');
  });

  it('avisa quando não há acesso ao cliente', async () => {
    renderizarApp('/demo/visao-geral', undefined, criarMockClient({ atrasoMs: 0, cenario: 'sem-permissao' }));
    expect(
      await screen.findByText('Você não tem acesso a esta tela. Fale com o gestor do seu painel.'),
    ).toBeInTheDocument();
  });

  it('avisa quando não há dados', async () => {
    renderizarApp('/demo/visao-geral', undefined, criarMockClient({ atrasoMs: 0, cenario: 'vazio' }));
    expect(await screen.findByText('Ainda não há dados para este período.')).toBeInTheDocument();
    // Antes da primeira carga, dadosAte e atualizadoEm vêm null: nada de data inventada.
    expect(screen.queryByText(/Dados até/)).toBeNull();
    expect(screen.getByText(/Ainda não houve carga\./)).toBeInTheDocument();
  });

  it('período e empresa vêm da sessão e vão na consulta da Visão geral', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const consultar = vi.spyOn(api, 'obterVisaoGeral');
    renderizarApp('/demo/visao-geral', undefined, api);
    await screen.findByRole('heading', { level: 3, name: 'Vendas' });

    // sem filtro, a consulta não leva mês nem empresa: a API usa o mais recente
    expect(consultar).toHaveBeenCalledWith({}, expect.anything());

    const periodo = await screen.findByRole('button', { name: /Período/ });
    expect(periodo).toHaveTextContent('Outubro de 2026');
    await user.click(periodo);
    const meses = within(screen.getByRole('menu', { name: 'Período' })).getAllByRole('menuitemradio');
    expect(meses.map((m) => m.textContent)).toEqual([
      'Outubro de 2026',
      'Setembro de 2026',
      'Agosto de 2026',
    ]);
    await user.click(meses[1]!);
    // o mês vai como AAAA-MM (setembro já foi adiantado; ver adiantar.test.tsx)
    await waitFor(() => expect(consultar).toHaveBeenCalledWith({ mes: '2026-09' }, expect.anything()));

    await user.click(screen.getByRole('button', { name: /Empresa/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Filial Maracanaú' }));
    // (depois dela sai o mês anterior adiantado, com a mesma empresa)
    expect(consultar).toHaveBeenCalledWith(
      { mes: '2026-09', empresa: '0e000000-0000-4000-8000-000000000002' },
      expect.anything(),
    );

    // de volta ao padrão: a consulta sem filtro já está no cache
    const antes = consultar.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByRole('button', { name: /Período/ })).toHaveTextContent('Outubro de 2026');
    expect(consultar.mock.calls.slice(antes)).not.toContainEqual([{}, expect.anything()]);
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
