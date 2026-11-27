import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { criarMockClient, fixturesPainel } from '../../api/mockClient';
import type { CartaoRealIdeal, CartaoTabela, PainelPayload } from '../../contracts/painel';
import { renderizarApp } from '../../test/renderizar';

// O Estoque (EST-01) usa o demo do back: 15 famílias, medianas de 4,2× e 33%, a Picanha sem estoque.
const abrir = (rota = '/demo/estoque', api = criarMockClient({ atrasoMs: 0 })) => ({
  api,
  ...renderizarApp(rota, undefined, api),
});
const matriz = () => screen.getByRole('article', { name: /Matriz BCG/ });
const acoes = () => screen.getByRole('article', { name: /O que fazer em cada quadrante/ });
const menu = () =>
  within(screen.getByRole('navigation', { name: 'Painéis' }))
    .getAllByRole('link')
    .map((a) => a.textContent);

describe('Estoque: Matriz BCG', () => {
  it('é o retrato de hoje: o frescor da API e só os filtros Seção e Classe BCG', async () => {
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Estoque' })).toBeInTheDocument();
    await screen.findByRole('heading', { level: 2, name: /Matriz BCG/ });
    expect(screen.getByText('Estoque de hoje, 12/10, atualizado às 9h')).toBeInTheDocument();
    const barra = screen.getByRole('group', { name: 'Filtros' });
    expect(within(barra).getByRole('button', { name: /Seção/ })).toBeInTheDocument();
    expect(within(barra).getByRole('button', { name: /Classe BCG/ })).toBeInTheDocument();
    expect(within(barra).queryByRole('button', { name: /Período/ })).toBeNull();
    expect(within(barra).queryByRole('button', { name: /Comparar com/ })).toBeNull();
    // está no menu da empresa da Distribuidora
    expect(menu()).toContain('Estoque');
  });

  it('abre a família no mesmo gráfico e volta pela trilha', async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole('heading', { level: 2, name: /Matriz BCG/ });
    expect(within(matriz()).getByText(/15 famílias · 38 principais produtos/)).toBeInTheDocument();
    // as legendas dos quadrantes vêm da API
    for (const q of ['Estrela', 'Vaca leiteira', 'Interrogação', 'Abacaxi'])
      expect(within(matriz()).getAllByText(q).length).toBeGreaterThan(0);

    await user.click(within(matriz()).getByRole('button', { name: 'Cortes nobres: abrir os produtos' }));
    const voltar = within(matriz()).getByRole('button', { name: 'Todas as famílias' });
    expect(voltar).toHaveFocus();
    expect(within(matriz()).getByText('Cortes nobres · 5 produtos')).toBeInTheDocument();
    expect(within(matriz()).getByText(/Produtos da família Cortes nobres/)).toBeInTheDocument();
    // os produtos não abrem nada: nenhuma bolha é botão
    expect(within(matriz()).queryByRole('button', { name: /abrir os produtos/ })).toBeNull();
    expect(within(matriz()).getByText('Picanha')).toBeInTheDocument();

    await user.click(voltar);
    expect(
      within(matriz()).getByRole('button', { name: 'Cortes nobres: abrir os produtos' }),
    ).toBeInTheDocument();
  });

  it('a família abre também pelo teclado', async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole('heading', { level: 2, name: /Matriz BCG/ });
    within(matriz()).getByRole('button', { name: 'Embutidos: abrir os produtos' }).focus();
    await user.keyboard('{Enter}');
    expect(within(matriz()).getByRole('button', { name: 'Todas as famílias' })).toHaveFocus();
  });

  it('clicar num quadrante filtra pela Classe BCG, e clicar de novo volta a todas', async () => {
    const user = userEvent.setup();
    const { api } = abrir();
    const consultar = vi.spyOn(api, 'obterPainel');
    await screen.findByRole('heading', { level: 2, name: /O que fazer/ });
    const estrela = () => within(acoes()).getByRole('button', { name: /^Estrela/ });
    expect(estrela()).toHaveAttribute('aria-pressed', 'false');
    // o alerta do estoque das Estrelas vem com status crítico
    expect(within(estrela()).getByText('R$ 165 mil')).toHaveClass('t-crit');

    await user.click(estrela());
    await waitFor(() => expect(estrela()).toHaveAttribute('aria-pressed', 'true'));
    expect(consultar).toHaveBeenLastCalledWith('demo', 'estoque', { classe: 'estrela' }, expect.anything());
    expect(
      within(screen.getByRole('group', { name: 'Filtros' })).getByRole('button', { name: /Classe BCG/ }),
    ).toHaveTextContent('Estrela');
    // as famílias de fora ficam apagadas, sem sair da matriz
    const vaca = within(matriz()).getByRole('button', { name: 'Cortes de frango: abrir os produtos' });
    expect(vaca).toHaveClass('dim');
    expect(
      within(matriz()).getByRole('button', { name: 'Cortes nobres: abrir os produtos' }),
    ).not.toHaveClass('dim');

    await user.click(estrela());
    // de volta ao padrão: a resposta sem filtro já está no cache
    await waitFor(() => expect(estrela()).toHaveAttribute('aria-pressed', 'false'));
    expect(
      within(screen.getByRole('group', { name: 'Filtros' })).getByRole('button', { name: /Classe BCG/ }),
    ).toHaveTextContent('Todas');
  });

  it('fica fora do menu da empresa sem unidade da Distribuidora, e a tela responde sem acesso', async () => {
    abrir('/leao-de-ouro/estoque', criarMockClient({ atrasoMs: 0, persona: 'admin' }));
    expect(await screen.findByText(/Você não tem acesso/)).toBeInTheDocument();
    expect(menu()).not.toContain('Estoque');
  });
});

// O resto do painel (fase 3): a fixture faz o papel da API (gerada a partir do demo da matriz).
const cartaoDaFixture = <T extends CartaoPainelTipo>(tipo: T['tipo'], id?: string) =>
  fixturesPainel.estoque.cartoes.find((c) => c.tipo === tipo && (!id || c.id === id)) as T;
type CartaoPainelTipo = PainelPayload['cartoes'][number];
const realIdeal = () => screen.getByRole('article', { name: /Estoque real contra ideal/ });
const linhasDe = (cartao: HTMLElement) => within(cartao).getAllByRole('row').slice(1);

describe('Estoque: o resto do painel', () => {
  it('mostra os KPIs e o aviso da API', async () => {
    abrir();
    const kpis = fixturesPainel.estoque.kpis;
    for (const k of kpis) expect((await screen.findAllByText(k.rotulo)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Retrato do estoque de hoje/)).toBeInTheDocument();
  });

  it('o real contra ideal abre seção › família › produto e volta pela trilha', async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole('heading', { level: 2, name: /Estoque real contra ideal/ });
    const cartao = cartaoDaFixture<CartaoRealIdeal>('real-ideal');
    const [secao] = cartao.itens;
    const familia = secao!.itens!.find((f) => !f.outros)!;

    await user.click(within(realIdeal()).getByRole('button', { name: new RegExp(`^${secao!.nome}`) }));
    expect(within(realIdeal()).getByRole('button', { name: 'Todas as seções' })).toBeInTheDocument();
    expect(within(realIdeal()).getByText(secao!.subtituloAberto!)).toBeInTheDocument();
    // a linha "Outros produtos da seção" não abre
    expect(within(realIdeal()).getByText('Outros produtos da seção').closest('button')).toBeNull();

    await user.click(within(realIdeal()).getByRole('button', { name: new RegExp(`^${familia.nome}`) }));
    const trilha = within(realIdeal()).getByRole('navigation', { name: 'Trilha' });
    expect(within(trilha).getByRole('button', { name: secao!.nome })).toBeInTheDocument();
    expect(within(trilha).getByText(familia.nome)).toHaveFocus();
    expect(within(realIdeal()).getByText(familia.itens![0]!.nome)).toBeInTheDocument();

    await user.click(within(trilha).getByRole('button', { name: 'Todas as seções' }));
    expect(within(realIdeal()).queryByRole('button', { name: 'Todas as seções' })).toBeNull();
  });

  it('com o filtro Seção, o real contra ideal já começa nela', async () => {
    const user = userEvent.setup();
    abrir();
    await screen.findByRole('heading', { level: 2, name: /Estoque real contra ideal/ });
    await user.click(
      within(screen.getByRole('group', { name: 'Filtros' })).getByRole('button', { name: /Seção/ }),
    );
    await user.click(screen.getByRole('menuitemradio', { name: 'Aves' }));
    const trilha = await within(realIdeal()).findByRole('navigation', { name: 'Trilha' });
    await waitFor(() => expect(within(trilha).getByText('Aves')).toBeInTheDocument());
  });

  it('a saúde do estoque mostra as faixas por grupo', async () => {
    abrir();
    const saude = await screen.findByRole('article', { name: /Saúde do estoque/ });
    for (const g of ['Falta', 'No ponto', 'Sobra'])
      expect(within(saude).getByRole('region', { name: g })).toBeInTheDocument();
    // o zerado não tem valor
    const zerado = within(saude).getByText('Zerado').closest('li')!;
    expect(zerado).toHaveTextContent('—');
  });

  it('a lista de críticos ordena pelo cabeçalho e esconde o atalho para uma tela que não existe', async () => {
    const user = userEvent.setup();
    abrir();
    const criticos = await screen.findByRole('article', { name: /Críticos: comprar já/ });
    const nomes = () =>
      linhasDe(criticos).map((l) => within(l).getAllByRole('cell')[0]!.firstChild?.textContent);
    const fixture = cartaoDaFixture<CartaoTabela>('tabela', 'criticos');
    const porEstoque = [...fixture.linhas]
      .sort((a, b) => (b.celulas[2]!.ordem as number) - (a.celulas[2]!.ordem as number))
      .map((l) => l.celulas[0]!.valor);

    await user.click(within(criticos).getByRole('button', { name: /^Estoque/ }));
    expect(within(criticos).getByRole('columnheader', { name: /^Estoque/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(nomes()).toEqual(porEstoque);
    await user.click(within(criticos).getByRole('button', { name: /^Estoque/ }));
    expect(nomes()).toEqual([...porEstoque].reverse());

    // o Compras ainda não existe no front: sem "Comprar →" e sem o atalho do cabeçalho
    expect(within(criticos).queryByRole('link')).toBeNull();
    expect(within(criticos).getByText(/fora dos principais/)).toBeInTheDocument();
  });

  it('excesso e parados: as 10 primeiras, ver todas, e a chave troca a lista', async () => {
    const user = userEvent.setup();
    const { api } = abrir();
    const consultar = vi.spyOn(api, 'obterPainel');
    const lista = () => screen.getByRole('article', { name: /Excesso e parados/ });
    await screen.findByRole('heading', { level: 2, name: /Excesso e parados/ });
    const total = cartaoDaFixture<CartaoTabela>('tabela', 'excesso-parados').linhas.length;
    expect(linhasDe(lista())).toHaveLength(10);

    await user.click(within(lista()).getByRole('button', { name: `Ver todas as ${total}` }));
    expect(linhasDe(lista())).toHaveLength(total);
    expect(within(lista()).getByRole('button', { name: 'Mostrar só as 10 primeiras' })).toBeInTheDocument();

    await user.click(within(lista()).getByRole('button', { name: 'Parados' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenLastCalledWith('demo', 'estoque', { lista: 'parados' }, expect.anything()),
    );
    await waitFor(() => expect(linhasDe(lista())).toHaveLength(4));
  });
});
