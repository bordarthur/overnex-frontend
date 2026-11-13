import { describe, expect, it, vi } from 'vitest';
import { fixtureSessao, fixturesPainel, fixtureVisaoGeral } from './mockClient';
import { ApiErro, semPermissao, textoDaRecusa } from './client';
import { criarHttpClient } from './httpClient';

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

function criar(resposta: Response, token: string | null = 'fake:abc') {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(resposta);
  const api = criarHttpClient({ getToken: async () => token, fetch });
  return { api, fetch };
}

// uma resposta nova a cada chamada: o corpo só pode ser lido uma vez
function criarComVarias(resposta: () => Response) {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => resposta());
  const api = criarHttpClient({ getToken: async () => 'fake:abc', fetch });
  return { api, fetch };
}

describe('cliente HTTP', () => {
  it('pede a Visão geral da empresa com o token e devolve o JSON', async () => {
    const { api, fetch } = criar(json(fixtureVisaoGeral));
    const controle = new AbortController();

    await expect(api.obterVisaoGeral('pj-cortes', {}, { signal: controle.signal })).resolves.toEqual(
      fixtureVisaoGeral,
    );

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('/api/telas/visao-geral?cliente=pj-cortes');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer fake:abc' });
    expect(init?.signal).toBe(controle.signal);
    expect(api.dadosFicticios).toBe(false);
  });

  it('manda o mês e a empresa (CNPJ) escolhidos na query, depois do cliente', async () => {
    const { api, fetch } = criar(json(fixtureVisaoGeral));
    await api.obterVisaoGeral('pj-cortes', {
      mes: '2026-09',
      empresa: '0e000000-0000-4000-8000-000000000001',
    });
    expect(fetch.mock.calls[0]![0]).toBe(
      '/api/telas/visao-geral?cliente=pj-cortes&mes=2026-09&empresa=0e000000-0000-4000-8000-000000000001',
    );
  });

  it('pede um painel comercial com o cliente e os filtros na query', async () => {
    const { api, fetch } = criarComVarias(() => json(fixturesPainel.vendas));
    await expect(api.obterPainel('pj-cortes', 'vendas')).resolves.toEqual(fixturesPainel.vendas);
    expect(fetch.mock.calls[0]![0]).toBe('/api/telas/vendas?cliente=pj-cortes');

    await api.obterPainel('pj-cortes', 'equipe-comercial', { mes: '2026-09', canal: 'varejo' });
    expect(fetch.mock.calls[1]![0]).toBe(
      '/api/telas/equipe-comercial?cliente=pj-cortes&mes=2026-09&canal=varejo',
    );
  });

  it('um filtro chamado "cliente" não passa por cima do slug da empresa', async () => {
    const { api, fetch } = criar(json(fixturesPainel.vendas));
    await api.obterPainel('pj-cortes', 'vendas', { cliente: 'outra', canal: 'varejo' });
    expect(fetch.mock.calls[0]![0]).toBe('/api/telas/vendas?cliente=pj-cortes&canal=varejo');
  });

  it('pede os nomes de um cartão na rota dele, com o cliente e os filtros do painel', async () => {
    const { api, fetch } = criar(json({ colunas: [], linhas: [] }));
    await api.obterNomes('pj-cortes', 'pessoas', 'cargos-salarios', { mes: '2026-09', empresa: 'e1' });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(
      '/api/telas/pessoas/cartoes/cargos-salarios/nomes?cliente=pj-cortes&mes=2026-09&empresa=e1',
    );
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer fake:abc' });
  });

  it('grava a escolha de um seletor da Visão geral com PUT', async () => {
    const { api, fetch } = criar(new Response(null, { status: 204 }));
    await expect(api.salvarPreferenciaVisaoGeral('pj-cortes', 'linhas-custo', '3')).resolves.toBeUndefined();

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('/api/telas/visao-geral/preferencias/linhas-custo?cliente=pj-cortes');
    expect(init?.method).toBe('PUT');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer fake:abc',
      'Content-Type': 'application/json',
    });
    expect(init?.body).toBe('{"valor":"3"}');
  });

  it('grava as provisões com PUT nas rotas do cartão, em reais, com o cliente e a empresa da tela', async () => {
    const { api, fetch } = criarComVarias(() => new Response(null, { status: 204 }));
    await api.salvarPeriodoProvisoes('pj-cortes', 'fluxo-caixa', 'provisoes', { periodo: '12-meses' });
    await api.salvarGrupoProvisao(
      'pj-cortes',
      'fluxo-caixa',
      'provisoes',
      'folha',
      { ligado: true, valor: 900500 },
      { empresa: '0e000000-0000-4000-8000-000000000001' },
    );
    await api.salvarGrupoProvisao('pj-cortes', 'fluxo-caixa', 'provisoes', 'investimentos', {
      ligado: false,
      valor: null,
    });

    const [periodo, grupo, desligar] = fetch.mock.calls;
    expect(periodo![0]).toBe('/api/telas/fluxo-caixa/cartoes/provisoes/periodo?cliente=pj-cortes');
    expect(periodo![1]).toMatchObject({ method: 'PUT', body: '{"periodo":"12-meses"}' });
    expect(grupo![0]).toBe(
      '/api/telas/fluxo-caixa/cartoes/provisoes/grupos/folha?cliente=pj-cortes&empresa=0e000000-0000-4000-8000-000000000001',
    );
    expect(grupo![1]).toMatchObject({ method: 'PUT', body: '{"ligado":true,"valor":900500}' });
    expect(desligar![0]).toBe(
      '/api/telas/fluxo-caixa/cartoes/provisoes/grupos/investimentos?cliente=pj-cortes',
    );
    expect(desligar![1]?.body).toBe('{"ligado":false,"valor":null}');
  });

  it('a escolha vai com a empresa da tela, quando há', async () => {
    const { api, fetch } = criar(new Response(null, { status: 204 }));
    await api.salvarPreferenciaVisaoGeral('pj-cortes', 'linhas-custo', 'auto', {
      empresa: '0e000000-0000-4000-8000-000000000001',
    });
    expect(fetch.mock.calls[0]![0]).toBe(
      '/api/telas/visao-geral/preferencias/linhas-custo?cliente=pj-cortes&empresa=0e000000-0000-4000-8000-000000000001',
    );
  });

  it('a escolha recusada pela API vira ApiErro com o detail', async () => {
    const { api } = criar(json({ detail: 'Opção inválida.' }, 422));
    await expect(api.salvarPreferenciaVisaoGeral('pj-cortes', 'linhas-custo', '9')).rejects.toMatchObject({
      status: 422,
      message: 'Opção inválida.',
    });
  });

  it('pede a sessão: sem empresa escolhida e com o slug em ?cliente=', async () => {
    const { api, fetch } = criarComVarias(() => json(fixtureSessao));
    await expect(api.obterSessao()).resolves.toEqual(fixtureSessao);
    expect(fetch.mock.calls[0]![0]).toBe('/api/sessao');

    await api.obterSessao('pj-cortes');
    expect(fetch.mock.calls[1]![0]).toBe('/api/sessao?cliente=pj-cortes');
  });

  it('não manda Authorization sem token', async () => {
    const { api, fetch } = criar(json(fixtureVisaoGeral), null);
    await api.obterVisaoGeral('pj-cortes');
    expect(fetch.mock.calls[0]![1]?.headers).not.toHaveProperty('Authorization');
  });

  it('transforma 403 em ApiErro sem permissão, com o detail da API', async () => {
    const { api } = criar(json({ detail: 'Acesso negado.' }, 403));
    const erro = await api.obterVisaoGeral('outra-empresa').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ApiErro);
    expect(erro).toMatchObject({ status: 403, message: 'Acesso negado.' });
    expect(semPermissao(erro)).toBe(true);
  });

  it('no 401, renova o token uma vez e repete a chamada', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ detail: 'Não autenticado.' }, 401))
      .mockResolvedValueOnce(json(fixtureSessao));
    const renovarToken = vi.fn(async () => 'novo');
    const api = criarHttpClient({ getToken: async () => 'velho', renovarToken, fetch });

    await expect(api.obterSessao()).resolves.toEqual(fixtureSessao);
    expect(renovarToken).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[1]![1]?.headers).toMatchObject({ Authorization: 'Bearer novo' });
  });

  it('no 401 sem sessão para renovar, devolve o erro sem repetir', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ detail: 'Não autenticado.' }, 401));
    const api = criarHttpClient({ getToken: async () => 'velho', renovarToken: async () => null, fetch });

    await expect(api.obterSessao()).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('usa uma mensagem genérica quando o erro não traz detail em texto', async () => {
    const { api } = criar(new Response('Bad Gateway', { status: 502 }));
    const erro = await api.obterVisaoGeral('pj-cortes').catch((e: unknown) => e);
    expect(erro).toMatchObject({ status: 502, message: 'Erro 502 da API.' });
    expect(semPermissao(erro)).toBe(false);
  });
});

describe('cliente HTTP: Gestão (/api/admin)', () => {
  it('lê a moldura, uma empresa e as pessoas', async () => {
    const { api, fetch } = criarComVarias(() => json({}));
    await api.gestao.obterGestao();
    await api.gestao.obterCliente('pj-cortes');
    await api.gestao.obterUsuarios();

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/admin/gestao',
      '/api/admin/clientes/pj-cortes',
      '/api/admin/usuarios',
    ]);
    expect(fetch.mock.calls[0]![1]?.method).toBe('GET');
  });

  it('grava com PUT no corpo que o contrato pede e tira o feriado com DELETE, sem corpo', async () => {
    const { api, fetch } = criarComVarias(() => new Response(null, { status: 204 }));
    const id = '0d000000-0000-4000-8000-0000000000c0';
    await api.gestao.salvarPainel('pj-cortes', 'FIN-04', true);
    await api.gestao.salvarAcessoDoPerfil('pj-cortes', 'cliente_usuario', 'PES-01', false);
    await api.gestao.salvarPreferencia('pj-cortes', 'linhas-custo', '5');
    await api.gestao.salvarFeriado('pj-cortes', '2026-03-19', 'São José');
    await api.gestao.tirarFeriado('pj-cortes', '2026-03-19');
    await api.gestao.salvarUsuario(id, {
      nome: 'Caio',
      perfil: 'consultor',
      clientes: ['pj-cortes'],
      sessaoMinutos: null,
    });
    await api.gestao.salvarSessaoDoUsuario(id, 240);
    await api.gestao.salvarAcessoDoUsuario(id, false);

    const chamadas = fetch.mock.calls.map(([url, init]) => [init?.method, url, init?.body]);
    expect(chamadas).toEqual([
      ['PUT', '/api/admin/clientes/pj-cortes/paineis/FIN-04', '{"ligado":true}'],
      ['PUT', '/api/admin/clientes/pj-cortes/perfis/cliente_usuario/paineis/PES-01', '{"ve":false}'],
      ['PUT', '/api/admin/clientes/pj-cortes/preferencias/linhas-custo', '{"valor":"5"}'],
      ['PUT', '/api/admin/clientes/pj-cortes/feriados/2026-03-19', '{"nome":"São José"}'],
      ['DELETE', '/api/admin/clientes/pj-cortes/feriados/2026-03-19', undefined],
      [
        'PUT',
        `/api/admin/usuarios/${id}`,
        '{"nome":"Caio","perfil":"consultor","clientes":["pj-cortes"],"sessaoMinutos":null}',
      ],
      ['PUT', `/api/admin/usuarios/${id}/sessao`, '{"minutos":240}'],
      ['PUT', `/api/admin/usuarios/${id}/acesso`, '{"ativo":false}'],
    ]);
    // o DELETE não leva Content-Type
    expect(fetch.mock.calls[4]![1]?.headers).not.toHaveProperty('Content-Type');
  });

  it('regra quebrada (422 com texto) aparece como veio; 422 de formato (lista) vira erro genérico', async () => {
    const regra = criar(json({ detail: 'Mais de 12 h, só Admin BORD.' }, 422));
    const erroDeRegra = await regra.api.gestao.salvarSessaoDoUsuario('u1', 1440).catch((e: unknown) => e);
    expect(erroDeRegra).toMatchObject({ status: 422, message: 'Mais de 12 h, só Admin BORD.' });
    expect(textoDaRecusa(erroDeRegra, 'genérica')).toBe('Mais de 12 h, só Admin BORD.');

    const formato = criar(json({ detail: [{ loc: ['body', 'minutos'], msg: 'Field required' }] }, 422));
    const erroDeFormato = await formato.api.gestao.salvarSessaoDoUsuario('u1', 0).catch((e: unknown) => e);
    expect(erroDeFormato).toMatchObject({ status: 422 });
    expect(textoDaRecusa(erroDeFormato, 'genérica')).toBe('genérica');
    // falha de servidor também não mostra o texto técnico
    expect(textoDaRecusa(new ApiErro(500, 'Erro 500 da API.'), 'genérica')).toBe('genérica');
  });
});
