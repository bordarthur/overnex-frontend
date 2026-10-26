import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { criarMockClient, fixturesPainel } from '../../api/mockClient';
import type { PainelPayload } from '../../contracts/painel';
import { renderizarApp } from '../../test/renderizar';

const titulosDosCartoes = () =>
  screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim());
const cartao = (titulo: string) => screen.getByRole('article', { name: new RegExp(`^${titulo}`) });

describe('Painéis comerciais', () => {
  it('Vendas desenha os destaques e os cartões da API, na ordem', async () => {
    renderizarApp('/demo/vendas');
    expect(await screen.findByRole('heading', { level: 1, name: 'Vendas' })).toBeInTheDocument();
    expect(await screen.findByText('Projeção de fechamento')).toBeInTheDocument();
    const projecao = screen.getByText('Projeção de fechamento').closest('.hero') as HTMLElement;
    expect(within(projecao).getByText('R$ 6,54 mi')).toBeInTheDocument();
    expect(within(projecao).getByText('Atenção')).toBeInTheDocument();
    // números de apoio, abaixo dos destaques
    expect(document.querySelector('.apoios')).toHaveTextContent('Pedidos728');

    expect(titulosDosCartoes()).toEqual([
      'Como o mês está andando',
      'Por que a meta escorrega',
      'Ritmo por dia útil',
      'Linhas de produto ou serviço: receita e margem',
      'Canais',
      'Vendas nos últimos 12 meses',
      'Participação de cada linha nas vendas, mês a mês',
    ]);
    expect(screen.getByRole('link', { name: 'Vendas' })).toHaveAttribute('aria-current', 'page');

    // o fator marcado pela API e a linha de produto em farol crítico
    const fatores = cartao('Por que a meta escorrega');
    expect(within(fatores).getByText('Clientes que compram no mês').closest('.drv-row')).toHaveClass('cause');
    const linhas = cartao('Linhas de produto');
    const bovinos = within(linhas).getByText('Bovinos').closest('tr');
    expect(bovinos).toHaveClass('rowcf-crit');
    expect(within(bovinos!).getByText('Crítico')).toBeInTheDocument();
  });

  it('a chave Valor/Volume troca o gráfico do mês', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/vendas');
    const andamento = await screen.findByRole('article', { name: /^Como o mês está andando/ });
    expect(
      within(andamento).getByRole('img', { name: 'Como o mês está andando: valor' }),
    ).toBeInTheDocument();

    await user.click(within(andamento).getByRole('button', { name: 'Volume' }));
    expect(within(andamento).getByRole('button', { name: 'Volume' })).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(andamento).getByRole('img', { name: 'Como o mês está andando: volume' }),
    ).toBeInTheDocument();
  });

  it('os filtros próprios da tela vêm do payload e vão na consulta pelo id', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const consultar = vi.spyOn(api, 'obterPainel');
    renderizarApp('/demo/vendas', undefined, api);
    await screen.findByText('Projeção de fechamento');
    expect(consultar).toHaveBeenCalledWith('vendas', {}, expect.anything());

    await user.click(await screen.findByRole('button', { name: /Canal/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Varejo' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith('vendas', { canal: 'varejo' }, expect.anything()),
    );

    await user.click(screen.getByRole('button', { name: /Período/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Setembro de 2026' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith(
        'vendas',
        { canal: 'varejo', mes: '2026-09' },
        expect.anything(),
      ),
    );
  });

  it('Equipe comercial: ranking na ordem da API e atingimento com a etiqueta de rampa', async () => {
    renderizarApp('/demo/equipe-comercial');
    expect(await screen.findByRole('heading', { level: 1, name: 'Equipe comercial' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Supervisor/ })).toBeInTheDocument();

    const ranking = cartao('Ranking por projeção');
    const nomes = within(ranking)
      .getAllByRole('listitem')
      .map((li) => li.querySelector('.r-name')?.firstChild?.textContent);
    expect(nomes).toEqual([
      'Carla Mota',
      'Ana Ribeiro',
      'Elisa Rocha',
      'Bruno Lima',
      'Fábio Nunes',
      'Diego Alves',
    ]);

    const atingimento = cartao('Atingimento nos últimos 6 meses');
    expect(within(atingimento).getAllByText('rampa')).toHaveLength(2);
    expect(within(cartao('Destaques do mês')).getByText('Precisa de apoio').closest('.hlc')).toHaveClass(
      'crit',
    );
  });

  it('Clientes e atendimentos: aviso, KPIs e matriz, sem filtro próprio', async () => {
    renderizarApp('/demo/clientes');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Clientes e atendimentos' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Painel universal: não depende de saber quem é o cliente/),
    ).toBeInTheDocument();
    expect(screen.getByText('Atendimentos no mês')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Canal/ })).toBeNull();

    const matriz = cartao('Cruzamento: curva de receita × curva de margem');
    expect(within(matriz).getByRole('cell', { name: '8' })).toHaveClass('cx-crit');
    expect(within(matriz).getByRole('cell', { name: '206' })).not.toHaveClass('cx-crit');
  });

  it('o "i" abre a explicação que veio da API e fecha com Esc, devolvendo o foco', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/vendas');
    const ritmo = await screen.findByRole('article', { name: /^Ritmo por dia útil/ });
    const botao = within(ritmo).getByRole('button', { name: 'O que é o gráfico Ritmo por dia útil' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    // cartão sem explicação no payload não ganha o botão
    expect(
      within(cartao('Linhas de produto')).queryByRole('button', { name: /O que é o gráfico/ }),
    ).toBeNull();
    // o botão fica fora do título: o nome do cartão não muda
    expect(screen.getByRole('heading', { level: 2, name: 'Ritmo por dia útil' })).toBeInTheDocument();

    await user.click(botao);
    const caixa = screen.getByRole('dialog', { name: 'Ritmo por dia útil' });
    expect(caixa).toHaveTextContent(/Cada barra é o que foi vendido num dia útil/);
    expect(botao).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(botao).toHaveFocus();

    // clique fora também fecha
    await user.click(botao);
    await user.click(screen.getByRole('heading', { level: 1, name: 'Vendas' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('trocar de tela pelo menu começa do topo; clicar na tela aberta também volta ao topo', async () => {
    const user = userEvent.setup();
    const rolar = vi.spyOn(window, 'scrollTo');
    renderizarApp('/demo/vendas');
    await screen.findByText('Por que a meta escorrega');
    const topo = { top: 0, left: 0, behavior: 'instant' };

    rolar.mockClear();
    await user.click(screen.getByRole('link', { name: 'Equipe comercial' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Equipe comercial' })).toBeInTheDocument();
    expect(rolar).toHaveBeenCalledWith(topo);

    rolar.mockClear();
    await user.click(screen.getByRole('link', { name: 'Equipe comercial' }));
    expect(rolar).toHaveBeenCalledWith(topo);

    // trocar só o filtro não mexe na rolagem
    rolar.mockClear();
    await user.click(await screen.findByRole('button', { name: /Supervisor/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Paula' }));
    expect(rolar).not.toHaveBeenCalled();
    rolar.mockRestore();
  });

  it('trocar de painel pelo menu não mostra os números do anterior', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/vendas', undefined, criarMockClient({ atrasoMs: 20 }));
    await screen.findByText('Por que a meta escorrega');

    await user.click(screen.getByRole('link', { name: 'Equipe comercial' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Equipe comercial' })).toBeInTheDocument();
    expect(screen.queryByText('Por que a meta escorrega')).toBeNull();
    expect(await screen.findByText('Ranking por projeção')).toBeInTheDocument();
  });

  it('desenha o que vier no contrato, sem nome fixo', async () => {
    const payload: PainelPayload = {
      ...fixturesPainel.vendas,
      filtros: [],
      destaques: [],
      apoios: [],
      cartoes: [
        {
          id: 'qualquer',
          tipo: 'tabela',
          largura: 12,
          titulo: 'Cartão de teste',
          colunas: [{ rotulo: 'Nome' }, { rotulo: 'Valor' }],
          linhas: [
            { celulas: [{ valor: 'Linha X' }, { valor: { valor: 12.5, unidade: 'pct' }, fundo: 'critico' }] },
          ],
        },
      ],
    };
    renderizarApp(
      '/demo/vendas',
      undefined,
      criarMockClient({ atrasoMs: 0, paineis: { ...fixturesPainel, vendas: payload } }),
    );
    expect(await screen.findByRole('heading', { level: 2, name: 'Cartão de teste' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '12,5%' })).toHaveClass('cf-crit');
    expect(screen.queryByText('Por que a meta escorrega')).toBeNull();
  });

  it('mostra os estados de vazio, sem permissão e erro', async () => {
    const { unmount } = renderizarApp(
      '/demo/vendas',
      undefined,
      criarMockClient({ atrasoMs: 0, cenario: 'vazio' }),
    );
    expect(await screen.findByText('Ainda não há dados para este período.')).toBeInTheDocument();
    expect(screen.queryByText(/Dados até/)).toBeNull();
    unmount();

    const sem = renderizarApp(
      '/demo/clientes',
      undefined,
      criarMockClient({ atrasoMs: 0, cenario: 'sem-permissao' }),
    );
    expect(
      await screen.findByText('Você não tem acesso a esta tela. Fale com o gestor do seu painel.'),
    ).toBeInTheDocument();
    sem.unmount();

    renderizarApp('/demo/equipe-comercial', undefined, criarMockClient({ atrasoMs: 0, cenario: 'erro' }));
    expect(
      await screen.findByRole('button', { name: 'Tentar de novo' }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
