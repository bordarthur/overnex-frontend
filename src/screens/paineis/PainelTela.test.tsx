import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { criarMockClient, fixturesPainel } from '../../api/mockClient';
import type { PainelPayload } from '../../contracts/painel';
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
    expect(within(doze).getByText('Leitura rápida:', { exact: false }).closest('.callout')).toHaveClass(
      'crit',
    );

    const desvios = cartao('Maiores desvios contra o orçado');
    expect(within(desvios).getByText('Custo bovinos').closest('li')).toHaveClass('dv-crit');
    expect(within(desvios).getByText(`${MENOS}R$ 182 mil`)).toBeInTheDocument();
  });

  it('DRE: abre por nível, abre e fecha cada conta e filtra os desvios', async () => {
    const user = userEvent.setup();
    renderizarApp('/demo/resultado');
    const dre = await screen.findByRole('article', { name: /^DRE gerencial/ });
    const linha = (nome: string) => within(dre).queryByRole('row', { name: new RegExp(nome) });

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
      expect(consultar).toHaveBeenCalledWith('resultado', { comparar: 'mes-anterior' }, expect.anything()),
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
    const pagar = within(lados).getByRole('region', { name: 'Contas a pagar' });
    expect(within(pagar).getByText('lançado: 58% da média paga')).toBeInTheDocument();
    expect(within(pagar).getByText('Mais de 90').closest('.at')).toHaveClass('zero');
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

    await user.click(screen.getByRole('button', { name: /Atraso/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Mais de 90 dias' }));
    await waitFor(() =>
      expect(consultar).toHaveBeenCalledWith('receber-pagar', { atraso: 'mais-90' }, expect.anything()),
    );
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
