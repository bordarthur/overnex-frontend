import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiErro } from '../../api/client';
import { criarMockClient, fixturesPainel } from '../../api/mockClient';
import type { Cartao, PainelPayload } from '../../contracts/painel';
import { MENOS } from '../../format';
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

  it('andamento do mês: as estatísticas em partes mostram cada valor inteiro', async () => {
    renderizarApp('/demo/vendas');
    const andamento = await screen.findByRole('article', { name: /^Como o mês está andando/ });
    const melhorPior = within(andamento).getByText('Melhor e pior dia').closest('.ms') as HTMLElement;
    expect(melhorPior.querySelector('b')).toHaveTextContent('R$ 341 mil · R$ 287 mil');
    expect(within(melhorPior).getByText('R$ 287 mil', { exact: false })).toBeInTheDocument();
    expect(within(andamento).getByText('Para a supermeta')).toBeInTheDocument();
    expect(within(andamento).getByText('No mesmo dia de setembro')).toBeInTheDocument();
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
    expect(consultar).toHaveBeenCalledWith('demo', 'vendas', {}, expect.anything());

    await user.click(await screen.findByRole('button', { name: /Canal/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Varejo' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith('demo', 'vendas', { canal: 'varejo' }, expect.anything()),
    );

    await user.click(screen.getByRole('button', { name: /Período/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Setembro de 2026' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith(
        'demo',
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

describe('Painéis financeiros', () => {
  it('Resultado desenha os destaques e os cartões da API, com o grupo Financeiro no menu', async () => {
    renderizarApp('/demo/resultado');
    expect(await screen.findByRole('heading', { level: 1, name: 'Resultado' })).toBeInTheDocument();
    const receita = (await screen.findByText('Receita líquida', { selector: '.h-label' })).closest(
      '.hero',
    ) as HTMLElement;
    expect(within(receita).getByText('R$ 6,84 mi')).toBeInTheDocument();
    expect(within(receita).getByText('Saudável')).toBeInTheDocument();
    expect(titulosDosCartoes()).toEqual([
      'Resultado mês a mês contra o orçado',
      'DRE em cascata: da receita ao lucro',
      'Ponto de equilíbrio',
      'Ponte do EBITDA: do orçado ao realizado',
      'Maiores desvios contra o orçado',
      'DRE gerencial de setembro, pelo plano de contas',
      'Tabela financeira mês a mês',
    ]);
    expect(screen.getByText('Financeiro', { selector: '.ngroup' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Resultado' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Visão/ })).toBeInTheDocument();

    // a "leitura rápida" vem como chamada, com o status da API
    const doze = cartao('Resultado mês a mês contra o orçado');
    // o custo vem logo depois da receita, antes da margem de contribuição
    expect(
      within(doze)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([
      'Receita bruta',
      'Custos',
      'Margem de contribuição',
      'Despesas fixas',
      'EBITDA',
      'Lucro líquido',
    ]);
    expect(within(doze).getByText('Leitura rápida:', { exact: false }).closest('.callout')).toHaveClass(
      'crit',
    );

    const desvios = cartao('Maiores desvios contra o orçado');
    expect(within(desvios).getByText('Custo bovinos').closest('li')).toHaveClass('dv-crit');
    expect(within(desvios).getByText(`${MENOS}R$ 182 mil`)).toBeInTheDocument();

    // tabela de tendência: números curtos e farol claro, sem negrito
    const tabela = cartao('Tabela financeira mês a mês');
    expect(within(tabela).getByRole('table')).toHaveClass('tbl-tendencia');
    expect(within(tabela).getByRole('cell', { name: '7,02 mi' })).toHaveClass('cf-ok');
    expect(within(tabela).getAllByRole('cell', { name: '26 d' }).length).toBeGreaterThan(0);
  });

  it('DRE: abre por nível, abre e fecha cada conta e filtra os desvios', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/resultado');
    const dre = await screen.findByRole('article', { name: /^DRE gerencial/ });
    const linha = (nome: string) => within(dre).queryByRole('row', { name: new RegExp(nome) });

    // valores cheios, sem o código da conta, e a unidade da tendência ao lado da faísca
    const receitaBruta = linha('Receita bruta')!;
    expect(within(receitaBruta).getByRole('cell', { name: '6.950.000' })).toBeInTheDocument();
    expect(within(dre).queryByText('100.00')).toBeNull();
    expect(within(receitaBruta).getByTitle('Em reais')).toHaveTextContent('$');
    expect(within(linha('^Custos')!).getByTitle('Em % da receita bruta')).toHaveTextContent('%');

    // começa no nível 2: grupos abertos, contas de nível 3 fechadas
    expect(linha('Venda de produtos')).not.toBeNull();
    expect(linha('Custo bovinos')).toBeNull();
    expect(linha('Receita líquida')).not.toBeNull();

    await user.click(within(dre).getByRole('button', { name: 'Nível 3' }));
    expect(linha('Custo bovinos')).not.toBeNull();

    await user.click(within(dre).getByRole('button', { name: 'Nível 1' }));
    expect(linha('Venda de produtos')).toBeNull();
    expect(linha('Lucro bruto')).not.toBeNull();

    const receita = within(dre).getByRole('button', { name: /Receita bruta/ });
    expect(receita).toHaveAttribute('aria-expanded', 'false');
    await user.click(receita);
    expect(receita).toHaveAttribute('aria-expanded', 'true');
    expect(linha('Venda de produtos')).not.toBeNull();
    expect(linha('Descontos')).toBeNull();

    // "Só desvios" abre tudo e esconde o que está no orçado
    await user.click(within(dre).getByRole('button', { name: 'Só desvios' }));
    expect(within(dre).getByRole('button', { name: 'Só desvios' })).toHaveAttribute('aria-pressed', 'true');
    expect(linha('Custo bovinos')).not.toBeNull();
    expect(linha('Energia elétrica, custo indireto')).toBeNull();
    expect(linha('Lucro líquido final')).toHaveClass('final');
  });

  it('DRE só com os níveis 1 e 2 (padrão da API): sem o botão do nível 3, e "Só desvios" para no 2', async () => {
    const user = userEvent.setup();
    const resultado = fixturesPainel.resultado;
    const payload: PainelPayload = {
      ...resultado,
      cartoes: resultado.cartoes.map((c) => (c.tipo === 'dre' ? { ...c, niveis: [1, 2] } : c)),
    };
    renderizarApp(
      '/demo/resultado',
      undefined,
      criarMockClient({ atrasoMs: 0, paineis: { ...fixturesPainel, resultado: payload } }),
    );
    const dre = await screen.findByRole('article', { name: /^DRE gerencial/ });
    expect(within(dre).queryByRole('button', { name: 'Nível 3' })).toBeNull();
    await user.click(within(dre).getByRole('button', { name: 'Só desvios' }));
    expect(within(dre).queryByRole('row', { name: /Custo bovinos/ })).toBeNull();
    expect(within(dre).queryByRole('row', { name: /CMV/ })).not.toBeNull();
  });

  it('no Resultado, "Comparar com" vai na consulta', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const consultar = vi.spyOn(api, 'obterPainel');
    renderizarApp('/demo/resultado', undefined, api);
    await screen.findByRole('heading', { level: 2, name: 'Ponto de equilíbrio' });

    await user.click(screen.getByRole('button', { name: /Comparar com/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Mês anterior' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith(
        'demo',
        'resultado',
        { comparar: 'mes-anterior' },
        expect.anything(),
      ),
    );
  });

  it('Receber e pagar: KPIs, janelas, os dois lados e quem cobrar', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const consultar = vi.spyOn(api, 'obterPainel');
    renderizarApp('/demo/receber-pagar', undefined, api);
    expect(await screen.findByRole('heading', { level: 1, name: 'Receber e pagar' })).toBeInTheDocument();
    expect(await screen.findByText('A receber em 30 dias')).toBeInTheDocument();

    // sem saldo bancário: três KPIs, sem "Saldo no fim" nem status nas janelas
    expect(document.querySelector('.kpis')).toHaveClass('three');
    const janelas = cartao('Próximos dias');
    expect(within(janelas).getAllByRole('region')).toHaveLength(3);
    expect(within(janelas).queryByText('Saldo no fim')).toBeNull();
    expect(within(janelas).queryByText('Saudável')).toBeNull();
    expect(within(janelas).getByText('Dado incompleto')).toBeInTheDocument();

    const lados = cartao('Contas a receber e a pagar');
    // cada lado tem o próprio título: o do cartão fica só para o leitor de tela
    expect(within(lados).getByRole('heading', { level: 2 }).closest('.visualmente-oculto')).not.toBeNull();
    const pagar = within(lados).getByRole('region', { name: 'Contas a pagar' });
    expect(within(pagar).getByText('lançado: 58% da média paga')).toBeInTheDocument();
    // idade dos títulos: o a vencer só na barra, com o texto dentro; um quadro por faixa vencida
    const receber = within(lados).getByRole('region', { name: 'Contas a receber' });
    expect(within(receber).getByText('A vencer: R$ 6,60 mi, 92,6% da carteira')).toBeInTheDocument();
    expect([...receber.querySelectorAll('.at2 span')].map((q) => q.textContent)).toEqual([
      '1 a 30 dias',
      '31 a 60',
      '61 a 90',
      'Mais de 90',
    ]);
    expect(within(receber).getByText('4,5% da carteira')).toBeInTheDocument();
    // faixa zerada: quadro apagado, fora da barra
    expect(within(pagar).getByText('Mais de 90').closest('.at2')).toHaveClass('zero');
    expect(pagar.querySelectorAll('.inad-bar > span')).toHaveLength(4);
    expect(within(lados).getAllByText('vencido')).toHaveLength(4);

    const cobrar = cartao('Quem cobrar hoje');
    const aurora = within(cobrar).getByText('Mercantil Aurora').closest('tr') as HTMLElement;
    expect(within(aurora).getByText('Média')).toBeInTheDocument();
    expect(within(aurora).getByText('12 dias').closest('td')).toHaveClass('cf-ok');
    expect(within(aurora).getByText('parou de comprar')).toHaveClass('tagn');
    // sem histórico de pagamento: texto apagado, sem pílula
    const saoJorge = within(cobrar).getByText('Mercado São Jorge').closest('tr') as HTMLElement;
    expect(within(saoJorge).getByText('sem histórico').closest('td')).toHaveClass('muted');
    expect(saoJorge.querySelector('.pill')).toBeNull();

    // ciclo de caixa: as réguas com os trechos da API, o rodapé e os prazos embaixo
    const ciclo = cartao('Ciclo de caixa');
    expect(
      within(ciclo).getByRole('img', { name: 'Compra → venda → recebe: Estoque 15 d, Recebimento 31 d' }),
    ).toBeInTheDocument();
    expect(within(ciclo).getByText('22 dias')).toHaveClass('preso');
    expect(ciclo).toHaveTextContent('Cada dia a menos libera cerca de R$ 230 mil');
    expect(within(ciclo).getByRole('img', { name: 'Ciclo de caixa: prazos mês a mês' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Atraso/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Mais de 90 dias' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith(
        'demo',
        'receber-pagar',
        { atraso: 'mais-90' },
        expect.anything(),
      ),
    );
  });
});

describe('Receber e pagar sem o estoque a custo', () => {
  it('sem o prazo de estoque, a API manda o cartão de prazos no lugar do ciclo, e ele é desenhado', async () => {
    const base = fixturesPainel['receber-pagar'];
    const prazos: Cartao = {
      id: 'prazos',
      tipo: 'graficos',
      largura: 7,
      titulo: 'Prazos de recebimento e de pagamento',
      subtitulo:
        'Prazo médio, em dias, nos últimos 12 meses. Quanto maior a distância, mais tempo o dinheiro fica preso.',
      nota: 'O ciclo de caixa completo (com o prazo de estoque) entra quando houver o custo do estoque.',
      graficos: [
        {
          grafico: {
            tipo: 'linhas',
            unidade: 'dias',
            rotulos: ['out', 'nov', 'dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set'],
            titulos: [
              'out-25',
              'nov-25',
              'dez-25',
              'jan-26',
              'fev-26',
              'mar-26',
              'abr-26',
              'mai-26',
              'jun-26',
              'jul-26',
              'ago-26',
              'set-26',
            ],
            series: [
              {
                nome: 'Pagamento',
                valores: [25, 24, 25, 25, 24, 24, 25, 24, 24, 24, 24, 24],
                estilo: 'secundaria',
                rotuloFim: 'Pagamento, 24 d',
              },
              {
                nome: 'Recebimento',
                valores: [26, 26, 27, 26, 26, 26, 27, 28, 29, 30, 30, 31],
                estilo: 'principal',
                rotuloFim: 'Recebimento, 31 d',
              },
            ],
            marcadores: [{ serie: 1, i: 5, rotulo: '26 dias' }],
          },
        },
      ],
    };
    const payload: PainelPayload = {
      ...base,
      cartoes: base.cartoes.map((c) => (c.id === 'ciclo-caixa' ? prazos : c)),
    };
    renderizarApp(
      '/demo/receber-pagar',
      undefined,
      criarMockClient({ atrasoMs: 0, paineis: { ...fixturesPainel, 'receber-pagar': payload } }),
    );
    const cartaoPrazos = await screen.findByRole('article', {
      name: /^Prazos de recebimento e de pagamento/,
    });
    expect(
      within(cartaoPrazos).getByRole('img', { name: 'Prazos de recebimento e de pagamento' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /^Ciclo de caixa/ })).toBeNull();
  });
});

describe('Fluxo de caixa', () => {
  it('desenha o aviso, os destaques e os cartões da API, sem o chip "Comparar com"', async () => {
    renderizarApp('/demo/fluxo-caixa');
    expect(await screen.findByRole('heading', { level: 1, name: 'Fluxo de caixa' })).toBeInTheDocument();
    expect(await screen.findByText(/Caixa realizado, pela data de compensação/)).toBeInTheDocument();
    expect(screen.getByText('Saldo final de setembro')).toBeInTheDocument();
    expect(document.querySelector('.apoios')).toHaveTextContent('Sem classificação');
    expect(titulosDosCartoes()).toEqual([
      'Saldo projetado dia a dia, 60 dias',
      'De onde vem a projeção',
      'Semana a semana',
      'Provisões pelo histórico',
      'Pago contra lançado Atenção',
      'Para onde vai o caixa em 30 dias',
      'Do saldo inicial ao saldo final',
      'Geração de caixa realizada',
      'Fluxo de caixa realizado',
    ]);
    expect(screen.getByRole('link', { name: 'Fluxo de caixa' })).toHaveAttribute('aria-current', 'page');
    // o caixa não tem orçado: sem o chip de comparação; o filtro próprio da tela continua
    expect(screen.queryByRole('button', { name: /Comparar com/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Visão/ })).toBeInTheDocument();
    // a projeção não vira chip da barra: a chave fica no cabeçalho do saldo projetado
    expect(screen.queryByRole('button', { name: /Projeção/ })).toBeNull();
    const saldo = cartao('Saldo projetado');
    expect(within(saldo).getByRole('group', { name: 'Projeção' })).toBeInTheDocument();
    expect(within(saldo).getByRole('button', { name: 'Só lançados' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // o caixa mínimo em laranja, com o rótulo à esquerda; o alerta das contas a pagar no fim
    expect(within(saldo).getByText('Caixa mínimo R$ 500 mil')).toHaveClass('reflabel', 'min');
    expect(within(saldo).getByText('R$ 1,59 mi em 13/10')).toBeInTheDocument();
    expect(saldo.querySelector('.callout.warn')).toHaveTextContent('Contas a pagar incompletas');
  });

  it('a chave da projeção vai na consulta e troca o saldo, a origem e as semanas', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const consultar = vi.spyOn(api, 'obterPainel');
    renderizarApp('/demo/fluxo-caixa', undefined, api);
    const saldo = await screen.findByRole('article', { name: /^Saldo projetado/ });
    const origem = cartao('De onde vem a projeção');
    // só lançados: o que não foi lançado vem riscado, e a V2 também
    expect(origem.querySelectorAll('li.riscado')).toHaveLength(8);
    expect(within(origem).getByText(`${MENOS}R$ 410 mil`).tagName).toBe('S');

    await user.click(within(saldo).getByRole('button', { name: 'Lançados + provisões' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith(
        'demo',
        'fluxo-caixa',
        { projecao: 'provisoes' },
        expect.anything(),
      ),
    );
    expect(await within(cartao('Saldo projetado')).findByText(/^Menor saldo R\$/)).toBeInTheDocument();
    expect(
      within(cartao('Saldo projetado')).getByRole('button', { name: 'Lançados + provisões' }),
    ).toHaveAttribute('aria-pressed', 'true');
    // com provisões, só a inadimplência (V2) fica riscada
    expect(cartao('De onde vem a projeção').querySelectorAll('li.riscado')).toHaveLength(1);
    expect(cartao('Semana a semana')).toHaveTextContent('com as provisões');

    // "Limpar filtros" volta a Visão ao padrão, mas não mexe na chave do cartão
    await user.click(screen.getByRole('button', { name: /Visão/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Acumulado de 2026' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenLastCalledWith(
        'demo',
        'fluxo-caixa',
        { projecao: 'provisoes', visao: 'ano' },
        expect.anything(),
      ),
    );
    await user.click(await screen.findByRole('button', { name: 'Limpar filtros' }));
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull();
    expect(
      within(cartao('Saldo projetado')).getByRole('button', { name: 'Lançados + provisões' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('semana a semana: o mês na pílula, o traço na virada do mês e o farol no menor saldo', async () => {
    renderizarApp('/demo/fluxo-caixa');
    const semanas = await screen.findByRole('article', { name: /^Semana a semana/ });
    const linha = (texto: string) => within(semanas).getByText(texto).closest('tr') as HTMLElement;
    expect(within(linha('13/10 a 18/10')).getByText('out')).toHaveClass('tag-marca');
    expect(linha('13/10 a 18/10')).not.toHaveClass('sep');
    expect(linha('26/10 a 01/11')).toHaveClass('sep');
    expect(within(linha('26/10 a 01/11')).getByText('nov')).toBeInTheDocument();
    expect(linha('02/11 a 08/11')).not.toHaveClass('sep');
    const celulas = within(linha('13/10 a 18/10')).getAllByRole('cell');
    expect(celulas.map((c) => c.textContent)).toEqual([
      'out13/10 a 18/10',
      'R$ 976 mil',
      `${MENOS}R$ 450 mil`,
      'R$ 1,95 mi',
      'R$ 1,59 mi',
    ]);
    expect(celulas[4]).toHaveClass('cf-ok');
  });

  it('pago contra lançado: barras pelo farol, os quadros e o rodapé com destaques', async () => {
    renderizarApp('/demo/fluxo-caixa');
    const pago = await screen.findByRole('article', { name: /^Pago contra lançado/ });
    const quadros = pago.querySelectorAll('.quadro');
    expect(quadros).toHaveLength(2);
    expect(quadros[0]).toHaveClass('warn');
    expect(quadros[0]).toHaveTextContent('Próximos 30 dias58% da média paga');
    expect(quadros[1]).not.toHaveClass('warn');
    expect(within(pago).getByText('R$ 3,66 mi').tagName).toBe('B');
    expect(pago.querySelectorAll('.bar.warnb')).toHaveLength(1);
    expect(pago.querySelector('.legend i.quadrado-laranja')).not.toBeNull();
  });

  it('árvore mês a mês: abre por nível, mês sem movimento vazio e farol nas células da API', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/fluxo-caixa');
    const fluxo = await screen.findByRole('article', { name: /^Fluxo de caixa realizado/ });
    const linha = (nome: string) => within(fluxo).queryByRole('row', { name: new RegExp(nome) });

    expect(
      within(fluxo)
        .getAllByRole('columnheader')
        .map((c) => c.textContent),
    ).toEqual(['Conta (R$)', 'abr-26', 'mai-26', 'jun-26', 'jul-26', 'ago-26', 'set-26']);
    // começa no nível 2: grupos do plano à vista, contas de nível 3 fechadas
    expect(linha('Recebimentos de clientes')).not.toBeNull();
    expect(linha('Venda de produtos')).toBeNull();
    expect(linha('Saldo final')).toHaveClass('final');
    expect(within(linha('Saldo final')!).getByRole('cell', { name: '1.474.000' })).toBeInTheDocument();

    await user.click(within(fluxo).getByRole('button', { name: 'Nível 3' }));
    expect(linha('Venda de produtos')).not.toBeNull();
    await user.click(within(fluxo).getByRole('button', { name: 'Nível 1' }));
    expect(linha('Recebimentos de clientes')).toBeNull();
    expect(linha('Geração operacional')).not.toBeNull();

    const entradas = within(fluxo).getByRole('button', { name: /Entradas de financiamento/ });
    await user.click(entradas);
    expect(entradas).toHaveAttribute('aria-expanded', 'true');
    // captação só em junho: os outros meses ficam vazios
    const captacao = within(linha('Captação de empréstimos')!).getAllByRole('cell');
    expect(captacao.slice(1).map((c) => c.textContent)).toEqual(['', '', '200.000', '', '', '']);

    // geração negativa em vermelho, positiva em azul, como a API mandou
    const geracao = within(linha('Geração operacional')!).getAllByRole('cell');
    expect(geracao[2]).toHaveTextContent(`${MENOS}60.000`);
    expect(geracao[2]).toHaveClass('cfl-crit');
    expect(geracao[1]).toHaveClass('cfl-ok');
    expect(fluxo).toHaveTextContent('Sem classificação: caixa de contas sem de-para');
  });

  it('a coluna do acumulado vem separada dos meses', async () => {
    const base = fixturesPainel['fluxo-caixa'];
    const payload: PainelPayload = {
      ...base,
      cartoes: base.cartoes.map((c) =>
        c.tipo === 'arvore-mensal'
          ? {
              ...c,
              colunas: [...c.colunas, { rotulo: 'Acumulado', total: true }],
              linhas: c.linhas.map((l) => ({ ...l, valores: [...l.valores, 0] })),
            }
          : c,
      ),
    };
    renderizarApp(
      '/demo/fluxo-caixa',
      undefined,
      criarMockClient({ atrasoMs: 0, paineis: { ...fixturesPainel, 'fluxo-caixa': payload } }),
    );
    const fluxo = await screen.findByRole('article', { name: /^Fluxo de caixa realizado/ });
    expect(within(fluxo).getByRole('columnheader', { name: 'Acumulado' })).toHaveClass('am-total');
  });

  it('o filtro Visão vai na consulta pelo id', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const consultar = vi.spyOn(api, 'obterPainel');
    renderizarApp('/demo/fluxo-caixa', undefined, api);
    await screen.findByRole('article', { name: /^Fluxo de caixa realizado/ });
    await user.click(screen.getByRole('button', { name: /Visão/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Acumulado de 2026' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith('demo', 'fluxo-caixa', { visao: 'ano' }, expect.anything()),
    );
  });

  it('provisões: chave, valor e período vão para a API, e a tela é pedida de novo', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const grupo = vi.spyOn(api, 'salvarGrupoProvisao');
    const periodo = vi.spyOn(api, 'salvarPeriodoProvisoes');
    const consultar = vi.spyOn(api, 'obterPainel');
    renderizarApp('/demo/fluxo-caixa', undefined, api);
    const provisoes = await screen.findByRole('article', { name: /^Provisões pelo histórico/ });
    const linha = (nome: string) => within(provisoes).getByText(nome).closest('tr') as HTMLElement;

    // investimentos começa desligado, com o campo parado
    const investimentos = within(provisoes).getByRole('switch', { name: 'Usar: Investimentos' });
    expect(investimentos).toHaveAttribute('aria-checked', 'false');
    expect(linha('Investimentos')).toHaveClass('desligado');
    expect(within(linha('Investimentos')).getByRole('textbox')).toBeDisabled();
    expect(
      within(linha('Fornecedores'))
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['', 'Fornecedores', 'R$ 4,16 mi', 'R$ 3,53 mi', 'R$ 630 mil', 'mil']);
    expect(within(linha('Fornecedores')).getByRole('textbox')).toHaveValue('630');

    const chamadas = consultar.mock.calls.length;
    await user.click(investimentos);
    await waitFor(() =>
      expect(grupo).toHaveBeenCalledWith(
        'demo',
        'fluxo-caixa',
        'provisoes',
        'investimentos',
        { ligado: true, valor: null },
        { empresa: undefined },
      ),
    );
    // gravou: a tela é pedida de novo e a chave volta ligada, como a API respondeu
    await waitFor(() => expect(consultar.mock.calls.length).toBeGreaterThan(chamadas));
    expect(
      await within(cartao('Provisões pelo histórico')).findByRole('switch', { name: 'Usar: Investimentos' }),
    ).toHaveAttribute('aria-checked', 'true');

    // valor digitado em mil vai em reais; volta com quem personalizou
    const campo = within(cartao('Provisões pelo histórico')).getByRole('textbox', {
      name: 'Valor usado: Fornecedores, em milhares de reais',
    });
    await user.clear(campo);
    await user.type(campo, '800{Enter}');
    await waitFor(() =>
      expect(grupo).toHaveBeenLastCalledWith(
        'demo',
        'fluxo-caixa',
        'provisoes',
        'fornecedores',
        { ligado: true, valor: 800000 },
        { empresa: undefined },
      ),
    );
    expect(
      await within(cartao('Provisões pelo histórico')).findByText('personalizado por você agora'),
    ).toBeInTheDocument();

    // vazio volta ao sugerido
    const personalizado = within(cartao('Provisões pelo histórico')).getByRole('textbox', {
      name: 'Valor usado: Fornecedores, em milhares de reais',
    });
    expect(personalizado).toHaveValue('800');
    await user.clear(personalizado);
    await user.tab();
    await waitFor(() =>
      expect(grupo).toHaveBeenLastCalledWith(
        'demo',
        'fluxo-caixa',
        'provisoes',
        'fornecedores',
        { ligado: true, valor: null },
        { empresa: undefined },
      ),
    );

    await user.click(within(cartao('Provisões pelo histórico')).getByRole('button', { name: '12 meses' }));
    await waitFor(() =>
      expect(periodo).toHaveBeenCalledWith(
        'demo',
        'fluxo-caixa',
        'provisoes',
        { periodo: '12-meses' },
        { empresa: undefined },
      ),
    );
    await waitFor(() =>
      expect(
        within(cartao('Provisões pelo histórico')).getByRole('button', { name: '12 meses' }),
      ).toHaveAttribute('aria-pressed', 'true'),
    );
  });

  it('provisões: texto que não é número não vai para a API, e a recusa da API aparece no cartão', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const grupo = vi
      .spyOn(api, 'salvarGrupoProvisao')
      .mockRejectedValue(new ApiErro(422, 'O valor precisa ser zero ou mais.'));
    renderizarApp('/demo/fluxo-caixa', undefined, api);
    const provisoes = await screen.findByRole('article', { name: /^Provisões pelo histórico/ });
    const campo = within(provisoes).getByRole('textbox', {
      name: 'Valor usado: Folha e encargos, em milhares de reais',
    });

    await user.clear(campo);
    await user.type(campo, 'mil{Enter}');
    expect(within(provisoes).getByRole('alert')).toHaveTextContent('Digite um número em mil, zero ou mais.');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(grupo).not.toHaveBeenCalled();

    await user.clear(campo);
    await user.type(campo, '900,5{Enter}');
    await waitFor(() =>
      expect(grupo).toHaveBeenCalledWith(
        'demo',
        'fluxo-caixa',
        'provisoes',
        'folha',
        { ligado: true, valor: 900500 },
        { empresa: undefined },
      ),
    );
    expect(
      await within(provisoes).findByText(/Não deu para salvar: O valor precisa ser zero ou mais\./),
    ).toBeInTheDocument();
  });

  it('provisões: sem `editavel`, chaves, período e campos ficam parados', async () => {
    const base = fixturesPainel['fluxo-caixa'];
    const payload: PainelPayload = {
      ...base,
      cartoes: base.cartoes.map((c) => (c.tipo === 'provisoes' ? { ...c, editavel: false } : c)),
    };
    renderizarApp(
      '/demo/fluxo-caixa',
      undefined,
      criarMockClient({ atrasoMs: 0, paineis: { ...fixturesPainel, 'fluxo-caixa': payload } }),
    );
    const provisoes = await screen.findByRole('article', { name: /^Provisões pelo histórico/ });
    for (const chave of within(provisoes).getAllByRole('switch')) expect(chave).toBeDisabled();
    for (const campo of within(provisoes).getAllByRole('textbox')) expect(campo).toBeDisabled();
    expect(within(provisoes).getByRole('button', { name: '6 meses' })).toBeDisabled();
  });

  it('mostra os estados de vazio, sem permissão e erro', async () => {
    const vazio = renderizarApp(
      '/demo/fluxo-caixa',
      undefined,
      criarMockClient({ atrasoMs: 0, cenario: 'vazio' }),
    );
    expect(await screen.findByText('Ainda não há dados para este período.')).toBeInTheDocument();
    vazio.unmount();

    const sem = renderizarApp(
      '/demo/fluxo-caixa',
      undefined,
      criarMockClient({ atrasoMs: 0, cenario: 'sem-permissao' }),
    );
    expect(
      await screen.findByText('Você não tem acesso a esta tela. Fale com o gestor do seu painel.'),
    ).toBeInTheDocument();
    sem.unmount();

    renderizarApp('/demo/fluxo-caixa', undefined, criarMockClient({ atrasoMs: 0, cenario: 'erro' }));
    expect(
      await screen.findByRole('button', { name: 'Tentar de novo' }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});

describe('Painel Pessoas', () => {
  it('desenha o aviso, os KPIs e os cartões da API, com o grupo Pessoas no menu', async () => {
    renderizarApp('/demo/pessoas');
    expect(await screen.findByRole('heading', { level: 1, name: 'Pessoas' })).toBeInTheDocument();
    expect(await screen.findByText(/Painel restrito: só perfis de diretoria e RH/)).toBeInTheDocument();
    // reais em milhares com casas (casasMil)
    const faturamento = screen.getByText('Faturamento por colaborador', { selector: '.k-l' }).closest('.kpi');
    expect(faturamento).toHaveTextContent('R$ 54,7 mil');

    expect(titulosDosCartoes()).toEqual([
      'O que mudou na equipe',
      'Faturamento por colaborador',
      'Colaboradores por setor',
      'Cada setor, mês a mês',
      'Cargos e salários',
      'Folha por setor',
      'Admissões, desligamentos e turnover',
      'Turnover por setor',
      'Tempo de casa',
      'Produtividade por setor',
    ]);
    expect(screen.getByRole('link', { name: 'Pessoas' })).toHaveAttribute('aria-current', 'page');

    expect(cartao('Faturamento por colaborador')).toHaveTextContent('▲ 3% em 12 meses');
    // o total de cada pilha vem da API e vai em cima da barra
    const totais = cartao('Colaboradores por setor').querySelectorAll('.ax.tot');
    expect(totais).toHaveLength(12);
    expect(totais[11]).toHaveTextContent('127');
    // três minigráficos por linha, um por setor
    expect(within(cartao('Cada setor, mês a mês')).getAllByRole('heading', { level: 3 })).toHaveLength(6);
  });

  it('a chave de setor troca os gráficos e a nota de admissões e turnover', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/pessoas');
    const admissoes = await screen.findByRole('article', { name: /^Admissões, desligamentos e turnover/ });
    expect(
      within(admissoes).getByRole('img', {
        name: 'Admissões, desligamentos e turnover: Todos: Turnover mensal',
      }),
    ).toBeInTheDocument();
    expect(admissoes).toHaveTextContent('Empresa toda: turnover médio de 2,5% ao mês, 29% em 12 meses.');

    await user.click(within(admissoes).getByRole('button', { name: 'Logística' }));
    expect(within(admissoes).getByRole('button', { name: 'Logística' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      within(admissoes).getByRole('img', {
        name: 'Admissões, desligamentos e turnover: Logística: Turnover mensal',
      }),
    ).toBeInTheDocument();
    expect(admissoes).toHaveTextContent('Logística: turnover médio de 3,1% ao mês, 36% em 12 meses.');
  });

  it('produtividade: escolher outro setor troca o gráfico ao lado', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/pessoas');
    const produtividade = await screen.findByRole('article', { name: /^Produtividade por setor/ });
    expect(within(produtividade).getByRole('button', { name: 'Comercial' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      within(produtividade).getByRole('heading', { level: 3, name: 'Comercial: faturamento por pessoa' }),
    ).toBeInTheDocument();
    // a comparação com 6 meses vem com o tom pronto
    const comercial = within(produtividade).getByRole('button', { name: 'Comercial' }).closest('tr')!;
    expect(within(comercial).getByText(`${MENOS}1,3%`)).toHaveClass('t-crit');

    await user.click(within(produtividade).getByRole('button', { name: 'Logística' }));
    expect(within(produtividade).getByRole('button', { name: 'Logística' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(produtividade).getByRole('button', { name: 'Comercial' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      within(produtividade).getByRole('img', { name: 'Logística: entregas por pessoa' }),
    ).toBeInTheDocument();
  });

  it('desenha a resposta enxuta da API: menos fatos, menos KPIs, cartões a menos e célula sem valor', async () => {
    const base = fixturesPainel.pessoas;
    const [mudou] = base.cartoes;
    const produtividade = base.cartoes.find((c) => c.id === 'produtividade-por-setor');
    if (mudou?.tipo !== 'destaques' || produtividade?.tipo !== 'lista-detalhe')
      throw new Error('fixture mudou');
    const [comercial] = produtividade.itens;
    const payload: PainelPayload = {
      ...base,
      aviso: {
        tom: 'info',
        texto: [
          { texto: 'Painel restrito.' },
          { texto: ' Sem folha em outubro de 2026: os números são de setembro de 2026.' },
        ],
      },
      // sem faturado, sai o "Faturamento por colaborador"
      kpis: base.kpis.filter((k) => k.rotulo !== 'Faturamento por colaborador'),
      cartoes: [
        { ...mudou, itens: mudou.itens.slice(0, 1) },
        {
          ...produtividade,
          // por enquanto um setor só, e o "vs 6m" pode vir sem valor
          itens: [{ ...comercial!, celulas: comercial!.celulas.map((c, i) => (i === 4 ? {} : c)) }],
        },
      ],
    };
    renderizarApp(
      '/demo/pessoas',
      undefined,
      criarMockClient({ atrasoMs: 0, paineis: { ...fixturesPainel, pessoas: payload } }),
    );
    expect(await screen.findByText(/Sem folha em outubro de 2026/)).toBeInTheDocument();
    expect(titulosDosCartoes()).toEqual(['O que mudou na equipe', 'Produtividade por setor']);
    expect(document.querySelectorAll('.kpi')).toHaveLength(3);
    // um fato só ocupa a linha inteira
    expect(cartao('O que mudou na equipe').querySelector('.hl')).toHaveStyle({ '--hl-colunas': '1' });
    const lista = cartao('Produtividade por setor');
    expect(within(lista).getByRole('button', { name: 'Comercial' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(lista).getByRole('img', { name: 'Comercial: faturamento por pessoa' })).toBeInTheDocument();
  });
});

describe('Mostrar nomes (Cargos e salários)', () => {
  it('ligada, pede a tabela de uma linha por pessoa com os filtros do painel; desligada, volta ao agregado', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    const pedir = vi.spyOn(api, 'obterNomes');
    renderizarApp('/demo/pessoas', undefined, api);
    expect(await screen.findByRole('heading', { level: 1, name: 'Pessoas' })).toBeInTheDocument();
    const cargos = await waitFor(() => cartao('Cargos e salários'));
    const chave = within(cargos).getByRole('switch', { name: 'Mostrar nomes' });
    expect(chave).toHaveAttribute('aria-checked', 'false');
    expect(within(cargos).getByText('Motorista entregador')).toBeInTheDocument();
    // desligada, nada de nome é pedido
    expect(pedir).not.toHaveBeenCalled();

    await user.click(chave);
    expect(await within(cargos).findByText('Renato Albuquerque')).toBeInTheDocument();
    expect(chave).toHaveAttribute('aria-checked', 'true');
    expect(within(cargos).getByRole('columnheader', { name: 'Pessoa' })).toBeInTheDocument();
    expect(within(cargos).getByText(/Uma linha por pessoa/)).toBeInTheDocument();
    expect(pedir).toHaveBeenCalledWith(
      'demo',
      'pessoas',
      'cargos-salarios',
      expect.any(Object),
      expect.anything(),
    );

    await user.click(chave);
    expect(within(cargos).queryByText('Renato Albuquerque')).toBeNull();
    expect(within(cargos).getByRole('columnheader', { name: 'Cargo' })).toBeInTheDocument();
    expect(within(cargos).getByText('Agregado por cargo. Nomes só no perfil de RH.')).toBeInTheDocument();
  });

  it('sem `nomes` no cartão (quem não pode ver dado nominal), não há chave', async () => {
    const base = fixturesPainel.pessoas;
    const payload: PainelPayload = {
      ...base,
      cartoes: base.cartoes.map((c) => (c.tipo === 'tabela' ? { ...c, nomes: null } : c)),
    };
    renderizarApp(
      '/demo/pessoas',
      undefined,
      criarMockClient({ atrasoMs: 0, paineis: { ...fixturesPainel, pessoas: payload } }),
    );
    const cargos = await waitFor(() => cartao('Cargos e salários'));
    expect(within(cargos).queryByRole('switch')).toBeNull();
  });

  it('recusa da API: mostra o texto dela no lugar da tabela', async () => {
    const user = userEvent.setup();
    const api = criarMockClient({ atrasoMs: 0 });
    vi.spyOn(api, 'obterNomes').mockRejectedValue(
      new ApiErro(403, 'Você não pode ver os nomes deste cartão.'),
    );
    renderizarApp('/demo/pessoas', undefined, api);
    const cargos = await waitFor(() => cartao('Cargos e salários'));

    await user.click(within(cargos).getByRole('switch', { name: 'Mostrar nomes' }));

    expect(await within(cargos).findByText('Você não pode ver os nomes deste cartão.')).toBeInTheDocument();
    expect(within(cargos).queryByText('Motorista entregador')).toBeNull();
  });
});
