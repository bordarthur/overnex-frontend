import type { PersonaFake } from '../auth/personasFake';
import type {
  AbaEmpresa,
  CamadaDoCliente,
  ClienteGestaoPayload,
  ConvitePedido,
  EmpresaCriada,
  MudancaEmpresa,
  MudancaUnidade,
  FiltroUsuarios,
  FonteDoCliente,
  GestaoPayload,
  MudancaUsuario,
  NovaEmpresa,
  NovoUsuario,
  PainelDoCliente,
  Rotulado,
  StatusGestao,
  UnidadeDaGestao,
  UsuarioGestao,
  UsuariosPayload,
} from '../contracts/gestao';
import type { NegociosSessao, NegociosValores } from '../contracts/negocios';
import type { ClienteSessao, Empresa, PerfilId, PeriodoDisponivel, SessaoPayload } from '../contracts/sessao';
import { ApiErro } from './client';
import dados from './fixtures/gestao.json';

// O "banco" do mock: empresas, pessoas, painéis ligados e a matriz de acesso, na memória. Imita o que
// o back faz em /api/sessao e /api/admin/* (api/app/admin no overnex-backend): as mesmas regras e os
// mesmos textos de erro, para a Gestão funcionar sem API. Aqui o mock calcula, porque faz o papel da
// API; as telas continuam só desenhando o que recebem. Tudo volta ao começo ao recarregar a página.

const ADMIN = 'admin';
// o Consultor por carteira abre a Gestão só para ler, e só as empresas da carteira
const CONSULTOR = 'consultor';
const SESSAO_MAXIMA_COMUM = 720;
const DOMINIO_ADMIN = '@bord.com.br';

export const MSG = {
  negado: 'Acesso negado.',
  cliente: 'Empresa não encontrada.',
  semCliente: 'Sua conta ainda não tem empresa. Fale com a BORD para liberar o acesso.',
  painel: 'Painel não encontrado.',
  perfilDaMatriz: 'Perfil não encontrado.',
  adminFixo: 'Admin BORD vê tudo e não pode ser alterado.',
  perfilNaoVe: 'Este perfil não vê o painel.',
  semNomes: 'Este painel não tem nomes para liberar.',
  semDado: 'Este painel ainda não tem dado nesta empresa.',
  preferencia: 'Preferência não encontrada.',
  opcao: 'Opção inválida.',
  feriado: 'Feriado não encontrado.',
  pessoa: 'Pessoa não encontrada.',
  perfil: 'Perfil inválido.',
  sessao: 'Tempo de sessão inválido.',
  sessaoLonga: 'Mais de 12 h, só Admin BORD.',
  adminEmail: 'Admin BORD só com e-mail da BORD.',
  ultimoAdmin: 'O Overnex precisa de pelo menos um Admin BORD ativo.',
  proprio: 'Você não pode tirar o próprio acesso de Admin BORD. Peça a outro Admin BORD.',
  nomeDaEmpresa: 'Informe o nome da empresa.',
  unidade: 'Unidade não encontrada.',
  nomeDaUnidade: 'Informe o nome da unidade.',
  unidadeRepetida: 'Já existe uma unidade com esse nome nesta empresa.',
  setor: 'Setor inválido.',
  uf: 'UF inválida.',
  slug: 'O identificador só aceita letras minúsculas, números e hífen (ex.: pj-cortes).',
  empresaCriada:
    'Empresa criada. Já dá para convidar as pessoas; os painéis ligam quando a primeira ' +
    'carga de dados chegar.',
  email: 'E-mail inválido.',
  jaTem: 'Este e-mail já tem cadastro no Overnex.',
  desativado: 'O acesso desta pessoa está desativado. Reative antes de mandar o convite.',
  jaEntrou: 'Esta pessoa já entrou no Overnex. Para trocar a senha, ela usa "Esqueci a senha".',
  naFila: 'O convite desta pessoa já está na fila.',
  apagarAtivo: 'Desative o acesso antes de apagar.',
  conviteNaFila: 'Convite na fila: sai em instantes.',
  notaConvite:
    'A pessoa recebe o convite por e-mail e cria a própria senha. O convite entra numa fila ' +
    'e sai em cerca de um minuto; se o envio falhar, a situação da pessoa mostra o motivo.',
} as const;

interface FonteFora {
  status: string;
  statusRotulo: string;
  observacao: string | null;
}

interface ClienteMock {
  slug: string;
  nome: string;
  sigla: string;
  // final do nome das tabelas do cliente (f_vendas_<sufixo>)
  sufixo: string;
  // fontes sem carga, com erro ou inativas, pelo prefixo da tabela; as outras estão ok
  fontesFora: Record<string, FonteFora>;
  ligados: string[];
  // perfil → códigos dos painéis que ele vê
  acesso: Record<string, string[]>;
  // perfil → códigos dos painéis em que ele vê os nomes (a chave "vê nomes"; só nos que ele vê)
  nomes: Record<string, string[]>;
  feriados: { data: string; nome: string }[];
  // escolhas gravadas (a mesma do seletor da Visão geral), por id
  preferencias: Record<string, string>;
  // o cadastro de unidades (cfg.empresa); sem ele, as unidades do mock inteiro, sem setor
  unidades?: UnidadeMock[];
}

/** Uma linha do cadastro de unidades, como a tabela da LANN: o setor pelo id de cfg.setor. */
interface UnidadeMock extends Omit<UnidadeDaGestao, 'setor'> {
  setor: string | null;
}

interface UsuarioMock {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  // slugs
  clientes: string[];
  // null = o padrão do perfil
  sessaoMinutos: number | null;
  ativo: boolean;
  // fila (pedido pela Gestão, ainda não saiu) | falhou (o envio não saiu) | enviado | vencido
  convite: string | null;
  // só em "falhou": por que o convite não saiu
  motivo?: string | null;
  // só em "fila": quando o job "manda" o convite (Date.now())
  saiEm?: number;
  // texto do convite ("enviado ontem, 16h10") ou, desativado, de quando foi
  quando: string | null;
  quandoAntes?: string | null;
  entradas30d: number;
  ultimo: string | null;
}

export interface BancoGestao {
  clientes: ClienteMock[];
  usuarios: UsuarioMock[];
}

/** Pessoa do login fake → pessoa do banco do mock. */
const USUARIO_DA_PERSONA: Record<PersonaFake, string> = {
  cliente: '0d000000-0000-4000-8000-0000000001a1',
  admin: '0d000000-0000-4000-8000-0000000000ad',
  consultor: '0d000000-0000-4000-8000-0000000000c0',
  'sem-empresa': '0d000000-0000-4000-8000-0000000000e0',
};

export const usuarioDaPersona = (persona: PersonaFake) => USUARIO_DA_PERSONA[persona];

/** Banco novo, no estado da fixture. */
export function criarBancoGestao(): BancoGestao {
  const copia = structuredClone(dados);
  return {
    clientes: copia.clientes.map((c) => ({
      ...c,
      fontesFora: c.fontesFora as Record<string, FonteFora>,
      nomes: c.nomes as Record<string, string[]>,
      preferencias: {},
    })),
    usuarios: copia.usuarios,
  };
}

// Os CNPJs e os meses são os mesmos em toda empresa do mock: as fixtures das telas são uma só.
const EMPRESAS: Empresa[] = [
  { id: '0e000000-0000-4000-8000-000000000001', nome: 'Matriz Fortaleza' },
  { id: '0e000000-0000-4000-8000-000000000002', nome: 'Filial Maracanaú' },
];
const PERIODOS: PeriodoDisponivel[] = [
  { id: '2026-10', rotulo: 'Outubro de 2026', dadosAte: '2026-10-12' },
  { id: '2026-09', rotulo: 'Setembro de 2026', dadosAte: '2026-09-30' },
  { id: '2026-08', rotulo: 'Agosto de 2026', dadosAte: '2026-08-31' },
];

// os setores de cfg.setor, na ordem
const SETORES = dados.setores as Rotulado[];

// código da tela → setores em que ela vale (app/seguranca/setores.py no back)
const SETORES_DA_TELA: Record<string, string[]> = { 'EST-01': ['distribuidora'] };

/** As unidades do cliente na ordem da bandeja: setor (de cfg.setor), grupo e nome. */
function unidadesDo(c: ClienteMock): UnidadeMock[] {
  const lista =
    c.unidades ??
    EMPRESAS.map((e) => ({
      ...e,
      setor: null,
      segmento: null,
      grupo: null,
      uf: null,
      cidade: null,
      bairro: null,
      endereco: null,
    }));
  const ordem = (setor: string | null) =>
    setor == null ? SETORES.length : SETORES.findIndex((x) => x.id === setor);
  return [...lista].sort(
    (a, b) =>
      ordem(a.setor) - ordem(b.setor) ||
      (a.grupo ?? '').localeCompare(b.grupo ?? '', 'pt-BR') ||
      a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }),
  );
}

/** Os setores das unidades, sem repetir, na ordem de cfg.setor. */
const setoresDo = (c: ClienteMock): Rotulado[] =>
  SETORES.filter((s) => unidadesDo(c).some((u) => u.setor === s.id));

/** A árvore da bandeja "Negócios": só com mais de um grupo (setor e grupo). */
function negociosDo(c: ClienteMock): NegociosSessao | null {
  const unidades = unidadesDo(c);
  if (new Set(unidades.map((u) => `${u.setor}/${u.grupo}`)).size <= 1) return null;
  const setores = [...new Set(unidades.map((u) => u.setor))].map((setor) => {
    const doSetor = unidades.filter((u) => u.setor === setor);
    const id = setor ?? 'sem-setor';
    return {
      id,
      rotulo: SETORES.find((x) => x.id === setor)?.rotulo ?? 'Sem setor',
      grupos: [...new Set(doSetor.map((u) => u.grupo))].map((grupo) => ({
        id: `${id}/${grupo ?? 'sem-grupo'}`,
        rotulo: grupo ?? 'Sem grupo',
        unidades: doSetor.filter((u) => u.grupo === grupo).map((u) => u.id),
      })),
    };
  });
  return { setores, telasPorSetor: {} };
}

/** Faturado fictício de uma unidade, fixo pelo id (o mock faz o papel da API). */
function faturadoFicticio(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return 150_000 + (h % 330) * 1_000;
}

/** Como GET /api/negocios: os valores da bandeja, do setor, do grupo e da unidade inteiros. */
export function valoresNegociosDo(banco: BancoGestao, slug: string, mes?: string): NegociosValores {
  const arvore = negociosDo(clienteDoSlug(banco, slug));
  const brl = (valor: number) => ({ valor, unidade: 'brl' as const });
  const soma = (ids: string[]) => ids.reduce((t, id) => t + faturadoFicticio(id), 0);
  const periodo = PERIODOS.find((p) => p.id === mes);
  // como a API: mês fora dos períodos da sessão é 422; com um negócio só, os mapas vêm vazios
  if (mes !== undefined && !periodo) throw new ApiErro(422, 'Mês sem dados.');
  if (!arvore) return { rotulo: 'Sem faturado para mostrar.', setores: {}, grupos: {}, unidades: {} };
  return {
    rotulo:
      !periodo || periodo === PERIODOS[0]
        ? 'Valores: faturado de 1º a 12/10'
        : `Valores: faturado em ${periodo.rotulo.toLowerCase()}`,
    setores: Object.fromEntries(
      (arvore?.setores ?? []).map((s) => [s.id, brl(soma(s.grupos.flatMap((g) => g.unidades)))]),
    ),
    grupos: Object.fromEntries(
      (arvore?.setores ?? []).flatMap((s) => s.grupos.map((g) => [g.id, brl(soma(g.unidades))])),
    ),
    unidades: Object.fromEntries(
      (arvore?.setores ?? []).flatMap((s) =>
        s.grupos.flatMap((g) => g.unidades.map((u) => [u, brl(faturadoFicticio(u))])),
      ),
    ),
  };
}

const porNome = <T extends { nome: string }>(lista: T[]) =>
  [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

const perfilDe = (id: string) => dados.perfis.find((p) => p.id === id);
const rotuloPerfil = (id: string) => perfilDe(id)?.rotulo ?? id;
const sessaoPadrao = (perfil: string) => perfilDe(perfil)?.sessaoPadraoMinutos ?? 240;

/** 30 min, 1 h, 4 h, 24 h. */
function rotuloSessao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${String(resto).padStart(2, '0')} min` : `${horas} h`;
}

function agora(): string {
  const d = new Date();
  return `hoje, ${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
}

function clienteDoSlug(banco: BancoGestao, slug: string): ClienteMock {
  const c = banco.clientes.find((x) => x.slug === slug);
  if (!c) throw new ApiErro(404, MSG.cliente);
  return c;
}

/** Quem abre a Gestão (GET /api/admin/gestao e /clientes/{slug}): o Admin BORD e o consultor. */
export function quemAbreGestao(banco: BancoGestao, usuarioId: string): UsuarioMock {
  const u = banco.usuarios.find((x) => x.id === usuarioId);
  if (!u || !u.ativo || (u.perfil !== ADMIN && u.perfil !== CONSULTOR)) throw new ApiErro(403, MSG.negado);
  return u;
}

/** Usuários e gravações da Gestão: só o Admin BORD. */
export function soAdmin(banco: BancoGestao, usuarioId: string) {
  if (quemAbreGestao(banco, usuarioId).perfil !== ADMIN) throw new ApiErro(403, MSG.negado);
}

function pessoaDoId(banco: BancoGestao, id: string): UsuarioMock {
  const u = banco.usuarios.find((x) => x.id === id);
  if (!u) throw new ApiErro(404, MSG.pessoa);
  return u;
}

// ---------- /api/sessao ----------

const clienteSessao = (c: ClienteMock): ClienteSessao => ({
  nome: c.nome,
  sigla: c.sigla,
  logoUrl: null,
  slug: c.slug,
});

// consultor e cliente principal = gestor; cliente usuário = leitor (seg.papel_do_perfil no back)
const papelDoPerfil = (perfil: string) =>
  perfil === ADMIN ? 'admin' : perfil === 'cliente_usuario' ? 'leitor' : 'gestor';

/** Como GET /api/sessao: quem é a pessoa, as empresas que ela abre e, com a empresa escolhida, as telas dela. */
export function sessaoDoBanco(banco: BancoGestao, usuarioId: string, slug?: string): SessaoPayload {
  const u = banco.usuarios.find((x) => x.id === usuarioId);
  if (!u || !u.ativo) throw new ApiErro(403, MSG.negado);
  const admin = u.perfil === ADMIN;
  const lista = porNome(admin ? banco.clientes : banco.clientes.filter((c) => u.clientes.includes(c.slug)));

  let escolhido: ClienteMock | undefined;
  if (slug) {
    escolhido = lista.find((c) => c.slug === slug);
    // slug que a pessoa não pode abrir (ou que não existe)
    if (!escolhido) throw new ApiErro(403, MSG.negado);
  } else if (!admin && lista.length === 1) {
    escolhido = lista[0];
  }

  const liberadas = escolhido
    ? escolhido.ligados.filter((codigo) => admin || escolhido.acesso[u.perfil]?.includes(codigo))
    : [];
  // O Estoque (EST-01) ainda não está no catálogo da Gestão do mock: vale para quem vê as Vendas,
  // nas empresas com alguma unidade de um setor dele (como SETORES_DA_TELA no back).
  const setores = escolhido ? new Set(setoresDo(escolhido).map((s) => s.id)) : new Set<string>();
  const porSetor = Object.entries(SETORES_DA_TELA).filter(
    ([, deles]) => liberadas.includes('COM-01') && deles.some((s) => setores.has(s)),
  );
  const telas = [...liberadas, ...porSetor.map(([codigo]) => codigo)].sort();
  const negocios = escolhido ? negociosDo(escolhido) : null;
  return {
    usuario: { nome: u.nome, email: u.email },
    perfil: { id: u.perfil as PerfilId, rotulo: rotuloPerfil(u.perfil) },
    gestao: admin || u.perfil === CONSULTOR,
    clientes: lista.map(clienteSessao),
    cliente: escolhido ? clienteSessao(escolhido) : null,
    papel: escolhido ? papelDoPerfil(u.perfil) : null,
    empresas: escolhido ? unidadesDo(escolhido).map(({ id, nome }): Empresa => ({ id, nome })) : [],
    negocios: negocios && { ...negocios, telasPorSetor: Object.fromEntries(porSetor) },
    telas,
    periodos: escolhido ? PERIODOS : [],
    aviso: !admin && lista.length === 0 ? MSG.semCliente : null,
  };
}

/** A escolha gravada de um seletor do cliente; undefined = nunca escolheu (vale o padrão da fixture). */
export const preferenciaDoCliente = (banco: BancoGestao, slug: string, id: string): string | undefined =>
  banco.clientes.find((c) => c.slug === slug)?.preferencias[id];

export function gravarPreferenciaDoCliente(banco: BancoGestao, slug: string, id: string, valor: string) {
  const c = banco.clientes.find((x) => x.slug === slug);
  if (c) c.preferencias[id] = valor;
}

// ---------- camadas, painéis e fontes ----------

type PainelCatalogo = (typeof dados.paineis)[number];

const temCarga = (c: ClienteMock, prefixo: string) => !(prefixo in c.fontesFora);
const temDado = (c: ClienteMock, p: PainelCatalogo) => p.exige.some((prefixo) => temCarga(c, prefixo));
// a camada é a seção do menu ("Financeiro"); o nível vai em cada painel
const secaoDoPainel = (p: PainelCatalogo) => dados.camadas.find((k) => k.id === p.camada)?.rotulo ?? '';

const ESTADOS: Record<string, [string, StatusGestao]> = {
  ativa: ['Ativa', 'saudavel'],
  implantacao: ['Em implantação', 'atencao'],
  desligada: ['Desligada', 'neutro'],
};

function camadas(c: ClienteMock): CamadaDoCliente[] {
  return dados.camadas.map((k) => {
    const daCamada = dados.paineis.filter((p) => p.camada === k.id);
    const pendencias = daCamada
      .filter((p) => !c.ligados.includes(p.codigo) || !temDado(c, p))
      .map((p) => (temDado(c, p) ? `${p.nome}: desligado` : `${p.nome}: sem dado`));
    const estado = !daCamada.some((p) => c.ligados.includes(p.codigo))
      ? 'desligada'
      : pendencias.length === 0
        ? 'ativa'
        : 'implantacao';
    const [estadoRotulo, status] = ESTADOS[estado]!;
    return {
      id: k.id,
      rotulo: k.rotulo,
      estado,
      estadoRotulo,
      status,
      paineis: daCamada.map(({ codigo, nome, nivel }) => ({ codigo, nome, nivel })),
      pendencias,
    };
  });
}

function paineis(c: ClienteMock): PainelDoCliente[] {
  return dados.paineis.map((p) => {
    const disponivel = temDado(c, p);
    return {
      codigo: p.codigo,
      nome: p.nome,
      secao: secaoDoPainel(p),
      nivel: p.nivel,
      ligado: c.ligados.includes(p.codigo),
      podeLigar: disponivel,
      status: disponivel ? 'saudavel' : 'neutro',
      statusRotulo: disponivel ? 'disponível' : 'indisponível',
      nota: disponivel
        ? null
        : `Sem carga de ${p.exige.map((prefixo) => `${prefixo}*`).join(' ou ')} nesta empresa.`,
    };
  });
}

function fontes(c: ClienteMock): FonteDoCliente[] {
  return dados.fontes.map((f) => {
    const fora = c.fontesFora[f.prefixo];
    return {
      tabela: `${f.prefixo}${c.sufixo}`,
      usadaPor: dados.paineis.filter((p) => p.usa.includes(f.prefixo)).map((p) => p.nome),
      linhas: fora ? null : f.linhas,
      ultimaData: fora ? null : dados.ultimaData,
      status: (fora?.status ?? 'saudavel') as StatusGestao,
      statusRotulo: fora?.statusRotulo ?? 'ok',
      observacao: fora?.observacao ?? null,
    };
  });
}

// ---------- pessoas ----------

function usuario(banco: BancoGestao, u: UsuarioMock): UsuarioGestao {
  const admin = u.perfil === ADMIN;
  const adminsAtivos = banco.usuarios.filter((x) => x.perfil === ADMIN && x.ativo).length;
  const clientes = admin
    ? []
    : porNome(banco.clientes.filter((c) => u.clientes.includes(c.slug))).map((c) => ({
        slug: c.slug,
        nome: c.nome,
      }));

  const entrou = u.ultimo ? `último acesso ${u.ultimo}` : 'ainda não entrou';
  const situacao = (id: string, rotulo: string, quando: string, status: StatusGestao) => ({
    id,
    rotulo,
    quando,
    status,
    detalhe: id === 'nao-enviado' ? (u.motivo ?? null) : null,
  });
  const CONVITES: Record<string, [string, string, StatusGestao]> = {
    fila: ['fila', 'Convite na fila', 'atencao'],
    falhou: ['nao-enviado', 'Convite não enviado', 'critico'],
    enviado: ['convite', 'Convite enviado', 'atencao'],
    vencido: ['vencido', 'Convite vencido', 'critico'],
  };
  const doConvite = u.convite ? CONVITES[u.convite] : undefined;
  const comoEsta = !u.ativo
    ? situacao('inativo', 'Desativado', u.quando ?? '', 'neutro')
    : doConvite
      ? situacao(doConvite[0], doConvite[1], u.quando ?? '', doConvite[2])
      : !admin && clientes.length === 0
        ? situacao('sem-empresa', 'Sem empresa', entrou, 'critico')
        : situacao('ativo', 'Ativo', entrou, 'saudavel');

  const aoEntrar: UsuarioGestao['aoEntrar'] = !u.ativo
    ? { tipo: 'nada', rotulo: 'Não entra: acesso desativado' }
    : admin
      ? { tipo: 'lista', rotulo: `Abre a Gestão e escolhe entre as ${banco.clientes.length} empresas` }
      : clientes.length === 0
        ? { tipo: 'nada', rotulo: 'Não vê nada' }
        : clientes.length === 1
          ? { tipo: 'direto', rotulo: `Abre direto em ${clientes[0]!.nome}` }
          : { tipo: 'lista', rotulo: `Escolhe entre ${clientes.length} empresas` };

  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: { id: u.perfil, rotulo: rotuloPerfil(u.perfil) },
    todosOsClientes: admin,
    clientes,
    aoEntrar,
    sessaoMinutos: u.sessaoMinutos ?? sessaoPadrao(u.perfil),
    situacao: comoEsta,
    acessos: { entradas30d: u.entradas30d, ultimo: u.ultimo },
    podeDesativar: u.ativo && !(admin && adminsAtivos < 2),
    podeApagar: !u.ativo,
    // ativo, ainda não entrou e sem pedido na fila
    convite:
      u.ativo && !u.ultimo && u.convite && u.convite !== 'fila'
        ? { rotulo: u.convite === 'falhou' ? 'Tentar de novo' : 'Reenviar convite' }
        : null,
  };
}

// Quanto o convite fica na fila do mock, no lugar do job do back (cerca de um minuto).
const TEMPO_NA_FILA_MS = 40_000;

/** O "job" do mock: o convite que já esperou o tempo da fila passa a enviado. */
function despacharFila(banco: BancoGestao) {
  for (const u of banco.usuarios) {
    if (u.convite !== 'fila' || u.saiEm === undefined || Date.now() < u.saiEm) continue;
    u.convite = 'enviado';
    u.quando = `enviado ${agora()}`;
  }
}

function todosOsUsuarios(banco: BancoGestao) {
  despacharFila(banco);
  return porNome(banco.usuarios).map((u) => usuario(banco, u));
}

// ---------- GET /api/admin/* ----------

// Rótulos das abas, como no mockup Gestão M2.1.0. A última é "Horas e cargas" no mockup; ficou
// "Cargas" porque as horas de implantação não entram agora.
const ABAS = dados.abas as AbaEmpresa[];

/** As empresas que a pessoa vê na Gestão: todas (admin) ou as da carteira (consultor). */
const daGestao = (banco: BancoGestao, u: UsuarioMock) =>
  u.perfil === ADMIN ? banco.clientes : banco.clientes.filter((c) => u.clientes.includes(c.slug));

export function gestaoDoBanco(banco: BancoGestao, usuarioId: string): GestaoPayload {
  const u = quemAbreGestao(banco, usuarioId);
  const admin = u.perfil === ADMIN;
  return {
    permissoes: { criarEmpresa: admin, usuarios: admin },
    clientes: porNome(daGestao(banco, u)).map((c) => ({
      slug: c.slug,
      nome: c.nome,
      setores: setoresDo(c),
      camadas: camadas(c).map(({ id, rotulo, estado, estadoRotulo, status }) => ({
        id,
        rotulo,
        estado,
        estadoRotulo,
        status,
      })),
    })),
    perfis: !admin
      ? []
      : dados.perfis.map((p) => ({
          ...p,
          sessaoPadraoRotulo: rotuloSessao(p.sessaoPadraoMinutos),
          pessoas: banco.usuarios.filter((x) => x.perfil === p.id && x.ativo).length,
        })),
    sessoes: !admin
      ? []
      : dados.sessoes.map((minutos) => ({
          minutos,
          rotulo: rotuloSessao(minutos),
          soAdmin: minutos > SESSAO_MAXIMA_COMUM,
        })),
  };
}

export function clienteDoBanco(banco: BancoGestao, usuarioId: string, slug: string): ClienteGestaoPayload {
  const u = quemAbreGestao(banco, usuarioId);
  if (u.perfil !== ADMIN) {
    // empresa fora da carteira, ou que não existe: para o consultor, sempre 403
    const c = daGestao(banco, u).find((x) => x.slug === slug);
    if (!c) throw new ApiErro(403, MSG.negado);
    return {
      ...clienteCompleto(banco, c, false),
      abas: ABAS.filter((a) => dados.abasDoConsultor.includes(a.id)),
      permissoes: { editar: false, convidar: false, unidades: false },
      opcoesSetor: [],
      paineis: [],
      acesso: { perfis: [], linhas: [] },
      usuarios: [],
      preferencias: [],
      feriados: [],
      cargas: [],
      menu: [],
    };
  }
  return clienteCompleto(banco, clienteDoSlug(banco, slug), true);
}

/** A empresa como o Admin BORD a vê. `comUsuarios` false: o resumo sai sem o chip de usuários. */
function clienteCompleto(banco: BancoGestao, c: ClienteMock, comUsuarios: boolean): ClienteGestaoPayload {
  const slug = c.slug;
  const listaCamadas = camadas(c);
  const noAr = dados.paineis.filter((p) => c.ligados.includes(p.codigo));
  const ve = (perfil: string, codigo: string) => c.acesso[perfil]?.includes(codigo) ?? false;

  const pessoas = todosOsUsuarios(banco)
    .filter((u) => !u.todosOsClientes && u.clientes.some((k) => k.slug === slug))
    .map((u) => {
      const vistos = noAr.filter((p) => ve(u.perfil.id, p.codigo)).length;
      return {
        ...u,
        outrosClientes: u.clientes.filter((k) => k.slug !== slug),
        paineisQueVe: `${u.situacao.id === 'inativo' ? 0 : vistos} de ${noAr.length}`,
      };
    });

  const ativas = listaCamadas.filter((k) => k.estado === 'ativa').length;
  const ativos = pessoas.filter((u) => u.situacao.id !== 'inativo').length;
  const ultima = dados.cargas[0];

  const menu = new Map<string, { nome: string }[]>();
  for (const p of noAr) {
    if (!ve('cliente_principal', p.codigo) || !temDado(c, p)) continue;
    // como o menu do app: a Visão geral tem o grupo dela; os outros, a seção
    const grupo = p.codigo === 'VG-01' ? 'Visão' : secaoDoPainel(p);
    menu.set(grupo, [...(menu.get(grupo) ?? []), { nome: p.nome }]);
  }

  return {
    cliente: {
      slug: c.slug,
      nome: c.nome,
      logoUrl: null,
      setores: setoresDo(c),
    },
    abas: ABAS,
    permissoes: { editar: true, convidar: true, unidades: true },
    resumo: [
      {
        rotulo: `${ativas} de ${listaCamadas.length} camadas ativas`,
        status: ativas === listaCamadas.length ? 'saudavel' : 'atencao',
      },
      ...(comUsuarios
        ? [{ rotulo: `${ativos} ${ativos === 1 ? 'usuário' : 'usuários'}`, status: 'neutro' as const }]
        : []),
      ultima
        ? { rotulo: `Última carga: hoje, ${ultima.inicio}`, status: ultima.status as StatusGestao }
        : { rotulo: 'Sem carga ainda', status: 'critico' },
    ],
    camadas: listaCamadas,
    niveis: dados.niveis,
    unidades: unidadesDo(c).map((u) => ({ ...u, setor: SETORES.find((x) => x.id === u.setor) ?? null })),
    opcoesSetor: SETORES,
    fontes: fontes(c),
    paineis: paineis(c),
    acesso: {
      perfis: dados.perfis.map((p) => ({ id: p.id, rotulo: p.rotulo, fixo: p.id === ADMIN })),
      linhas: noAr.map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        ve: Object.fromEntries(dados.perfis.map((k) => [k.id, k.id === ADMIN || ve(k.id, p.codigo)])),
        nomes: p.temNomes
          ? Object.fromEntries(
              dados.perfis.map((k) => [
                k.id,
                k.id === ADMIN || (ve(k.id, p.codigo) && (c.nomes[k.id]?.includes(p.codigo) ?? false)),
              ]),
            )
          : null,
      })),
    },
    usuarios: pessoas,
    preferencias: dados.preferencias.map(({ padrao, ...p }) => ({
      ...p,
      valor: c.preferencias[p.id] ?? padrao,
      editavel: true,
    })),
    feriados: [...c.feriados].sort((a, b) => a.data.localeCompare(b.data)),
    cargas: dados.cargas.map((k) => ({ ...k, status: k.status as StatusGestao })),
    menu: [...menu].map(([grupo, itens]) => ({ grupo, itens })),
  };
}

export function usuariosDoBanco(banco: BancoGestao): UsuariosPayload {
  const usuarios = todosOsUsuarios(banco);
  const total = (condicao: (u: UsuarioGestao) => boolean) => usuarios.filter(condicao).length;
  const filtros: FiltroUsuarios[] = [
    { id: 'todos', rotulo: 'Todos', total: usuarios.length, atencao: false },
    ...dados.perfis.map((p) => ({
      id: p.id,
      rotulo: p.rotulo,
      total: total((u) => u.perfil.id === p.id),
      atencao: false,
    })),
    {
      id: 'pendentes',
      rotulo: 'Convites pendentes',
      total: total((u) => ['fila', 'nao-enviado', 'convite', 'vencido'].includes(u.situacao.id)),
      atencao: true,
    },
    {
      id: 'sem-empresa',
      rotulo: 'Sem empresa',
      total: total((u) => u.situacao.id === 'sem-empresa'),
      atencao: true,
    },
  ];
  return { usuarios, filtros, notaConvite: MSG.notaConvite };
}

// ---------- gravações ----------

function painelDoCodigo(codigo: string): PainelCatalogo {
  const p = dados.paineis.find((x) => x.codigo === codigo);
  if (!p) throw new ApiErro(404, MSG.painel);
  return p;
}

/** Liga ou desliga o painel. Sem dado, não liga; ligado pela primeira vez, os perfis recebem o padrão. */
export function mudarPainel(banco: BancoGestao, slug: string, codigo: string, ligado: boolean) {
  const c = clienteDoSlug(banco, slug);
  const p = painelDoCodigo(codigo);
  if (ligado === c.ligados.includes(codigo)) return;
  if (!ligado) {
    c.ligados = c.ligados.filter((x) => x !== codigo);
    return;
  }
  if (!temDado(c, p)) throw new ApiErro(422, MSG.semDado);
  c.ligados = [...c.ligados, codigo];
  const jaConfigurado = Object.values(c.acesso).some((codigos) => codigos.includes(codigo));
  if (!jaConfigurado) for (const perfil of p.padrao) c.acesso[perfil] = [...(c.acesso[perfil] ?? []), codigo];
}

export function mudarAcessoDoPerfil(
  banco: BancoGestao,
  slug: string,
  perfil: string,
  codigo: string,
  ve: boolean,
) {
  const c = clienteDoSlug(banco, slug);
  painelDoCodigo(codigo);
  if (perfil === ADMIN) throw new ApiErro(422, MSG.adminFixo);
  if (!perfilDe(perfil)) throw new ApiErro(404, MSG.perfilDaMatriz);
  const atuais = (c.acesso[perfil] ?? []).filter((x) => x !== codigo);
  c.acesso[perfil] = ve ? [...atuais, codigo] : atuais;
  // tirar o painel do perfil apaga a marca de nomes: ao pôr de volta, volta sem nomes
  if (!ve) c.nomes[perfil] = (c.nomes[perfil] ?? []).filter((x) => x !== codigo);
}

/** Como PUT …/perfis/{perfil}/paineis/{codigo}/nomes: a chave "vê nomes" do perfil no painel. */
export function mudarNomesDoPerfil(
  banco: BancoGestao,
  slug: string,
  perfil: string,
  codigo: string,
  veNomes: boolean,
) {
  const c = clienteDoSlug(banco, slug);
  const p = painelDoCodigo(codigo);
  if (perfil === ADMIN) throw new ApiErro(422, MSG.adminFixo);
  if (!perfilDe(perfil)) throw new ApiErro(404, MSG.perfilDaMatriz);
  if (!p.temNomes) throw new ApiErro(422, MSG.semNomes);
  if (!c.acesso[perfil]?.includes(codigo)) throw new ApiErro(422, MSG.perfilNaoVe);
  const atuais = (c.nomes[perfil] ?? []).filter((x) => x !== codigo);
  c.nomes[perfil] = veNomes ? [...atuais, codigo] : atuais;
}

export function mudarPreferencia(banco: BancoGestao, slug: string, id: string, valor: string) {
  const c = clienteDoSlug(banco, slug);
  const p = dados.preferencias.find((x) => x.id === id);
  if (!p) throw new ApiErro(404, MSG.preferencia);
  if (!p.opcoes.some((o) => o.id === valor)) throw new ApiErro(422, MSG.opcao);
  c.preferencias[id] = valor;
}

export function salvarFeriado(banco: BancoGestao, slug: string, data: string, nome: string) {
  const c = clienteDoSlug(banco, slug);
  c.feriados = [...c.feriados.filter((f) => f.data !== data), { data, nome: nome.trim() }];
}

export function tirarFeriado(banco: BancoGestao, slug: string, data: string) {
  const c = clienteDoSlug(banco, slug);
  if (!c.feriados.some((f) => f.data === data)) throw new ApiErro(404, MSG.feriado);
  c.feriados = c.feriados.filter((f) => f.data !== data);
}

function conferirSessao(minutos: number, perfil: string) {
  if (!dados.sessoes.includes(minutos)) throw new ApiErro(422, MSG.sessao);
  if (minutos > SESSAO_MAXIMA_COMUM && perfil !== ADMIN) throw new ApiErro(422, MSG.sessaoLonga);
}

const adminsAtivos = (banco: BancoGestao) =>
  banco.usuarios.filter((x) => x.perfil === ADMIN && x.ativo).length;

/** Troca nome, perfil, empresas e sessão. `autor`: quem está gravando (ninguém tira o próprio perfil de admin). */
export function mudarUsuario(banco: BancoGestao, autor: string, id: string, m: MudancaUsuario) {
  if (!perfilDe(m.perfil)) throw new ApiErro(422, MSG.perfil);
  const u = pessoaDoId(banco, id);
  const eraAdmin = u.perfil === ADMIN;
  const viraAdmin = m.perfil === ADMIN;
  const slugs = viraAdmin ? [] : [...new Set(m.clientes)];

  if (id === autor && !viraAdmin) throw new ApiErro(422, MSG.proprio);
  if (viraAdmin && !eraAdmin && !u.email.endsWith(DOMINIO_ADMIN)) throw new ApiErro(422, MSG.adminEmail);
  if (eraAdmin && !viraAdmin && u.ativo && adminsAtivos(banco) < 2) throw new ApiErro(422, MSG.ultimoAdmin);
  const faltam = slugs.filter((s) => !banco.clientes.some((c) => c.slug === s));
  if (faltam.length > 0) throw new ApiErro(422, `Empresa não encontrada: ${faltam.join(', ')}.`);
  if (m.sessaoMinutos != null) conferirSessao(m.sessaoMinutos, m.perfil);

  u.nome = m.nome.trim() || u.nome;
  u.perfil = m.perfil;
  u.clientes = slugs;
  // igual ao padrão do perfil = sem valor próprio
  u.sessaoMinutos = m.sessaoMinutos === sessaoPadrao(m.perfil) ? null : m.sessaoMinutos;
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Como POST /api/admin/clientes: a empresa nasce sem carga, com tudo desligado e sem pessoas. */
export function criarEmpresa(banco: BancoGestao, m: NovaEmpresa): EmpresaCriada {
  const nome = m.nome.trim().replace(/\s+/g, ' ');
  if (!nome) throw new ApiErro(422, MSG.nomeDaEmpresa);
  const semAcento = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const slug =
    m.slug?.trim() ||
    semAcento
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  if (!SLUG.test(slug)) throw new ApiErro(422, MSG.slug);
  if (banco.clientes.some((c) => c.slug === slug))
    throw new ApiErro(422, `Já existe uma empresa com o identificador ${slug}.`);

  banco.clientes.push({
    slug,
    nome,
    sigla: semAcento.slice(0, 2).toUpperCase(),
    sufixo: slug.replace(/-/g, '_'),
    fontesFora: Object.fromEntries(
      dados.fontes.map((f) => [
        f.prefixo,
        { status: 'critico', statusRotulo: 'sem carga', observacao: null },
      ]),
    ),
    ligados: [],
    acesso: {},
    nomes: {},
    feriados: [],
    preferencias: {},
  });
  return { slug, nome, mensagem: MSG.empresaCriada };
}

/** Como DELETE /api/admin/usuarios/{id}: apaga quem já está desativado; o e-mail fica livre. */
export function apagarUsuario(banco: BancoGestao, autor: string, id: string) {
  const u = pessoaDoId(banco, id);
  if (id === autor) throw new ApiErro(422, MSG.proprio);
  if (u.ativo) throw new ApiErro(422, MSG.apagarAtivo);
  banco.usuarios = banco.usuarios.filter((x) => x.id !== id);
}

/** Como PUT /api/admin/clientes/{slug}: troca o nome; o slug fica. */
export function mudarEmpresa(banco: BancoGestao, slug: string, m: MudancaEmpresa) {
  const c = clienteDoSlug(banco, slug);
  const nome = m.nome.trim().replace(/\s+/g, ' ');
  if (!nome) throw new ApiErro(422, MSG.nomeDaEmpresa);
  c.nome = nome;
}

// as 27 siglas, para conferir a UF como a API
const UFS = new Set(
  'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' '),
);
const limpo = (v: string | null) => v?.trim().replace(/\s+/g, ' ') || null;

/** Como PUT /api/admin/clientes/{slug}/unidades/{id}: troca as colunas da unidade; o cliente fica. */
export function mudarUnidade(banco: BancoGestao, slug: string, id: string, m: MudancaUnidade) {
  const c = clienteDoSlug(banco, slug);
  // a empresa sem cadastro próprio passa a ter o dela, a partir das unidades que mostrava
  c.unidades ??= unidadesDo(c).map((u) => ({ ...u }));
  const u = c.unidades.find((x) => x.id === id);
  if (!u) throw new ApiErro(404, MSG.unidade);
  const nome = limpo(m.nome);
  if (!nome) throw new ApiErro(422, MSG.nomeDaUnidade);
  if (c.unidades.some((x) => x.id !== id && x.nome.toLowerCase() === nome.toLowerCase()))
    throw new ApiErro(422, MSG.unidadeRepetida);
  if (m.setor != null && !SETORES.some((s) => s.id === m.setor)) throw new ApiErro(422, MSG.setor);
  const uf = limpo(m.uf)?.toUpperCase() ?? null;
  if (uf != null && !UFS.has(uf)) throw new ApiErro(422, MSG.uf);
  Object.assign(u, {
    nome,
    setor: m.setor,
    segmento: limpo(m.segmento),
    grupo: limpo(m.grupo),
    uf,
    cidade: limpo(m.cidade),
    bairro: limpo(m.bairro),
    endereco: limpo(m.endereco),
  });
}

// formato mínimo, como no back; quem valida de verdade é o envio do e-mail
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Como POST /api/admin/usuarios: cria a pessoa (ainda sem login) e põe o convite na fila. */
export function pedirConvite(banco: BancoGestao, m: NovoUsuario): ConvitePedido {
  const email = m.email.trim().toLowerCase();
  const admin = m.perfil === ADMIN;
  if (!EMAIL.test(email)) throw new ApiErro(422, MSG.email);
  if (!perfilDe(m.perfil)) throw new ApiErro(422, MSG.perfil);
  if (admin && !email.endsWith(DOMINIO_ADMIN)) throw new ApiErro(422, MSG.adminEmail);
  if (m.sessaoMinutos != null) conferirSessao(m.sessaoMinutos, m.perfil);
  const slugs = admin ? [] : [...new Set(m.clientes)];
  if (banco.usuarios.some((u) => u.email.toLowerCase() === email)) throw new ApiErro(422, MSG.jaTem);
  const faltam = slugs.filter((s) => !banco.clientes.some((c) => c.slug === s));
  if (faltam.length > 0) throw new ApiErro(422, `Empresa não encontrada: ${faltam.join(', ')}.`);

  const id = `0d000000-0000-4000-8000-${String(banco.usuarios.length + 1).padStart(12, 'f')}`;
  banco.usuarios.push({
    id,
    nome: m.nome.trim(),
    email,
    perfil: m.perfil,
    clientes: slugs,
    // igual ao padrão do perfil = sem valor próprio
    sessaoMinutos: m.sessaoMinutos === sessaoPadrao(m.perfil) ? null : m.sessaoMinutos,
    ativo: true,
    convite: 'fila',
    quando: `pedido ${agora()}`,
    saiEm: Date.now() + TEMPO_NA_FILA_MS,
    entradas30d: 0,
    ultimo: null,
  });
  return { id, mensagem: MSG.conviteNaFila };
}

/** Como POST /api/admin/usuarios/{id}/convite: mais um convite na fila, para quem ainda não entrou. */
export function repedirConvite(banco: BancoGestao, id: string): ConvitePedido {
  const u = pessoaDoId(banco, id);
  if (!u.ativo) throw new ApiErro(422, MSG.desativado);
  if (u.ultimo) throw new ApiErro(422, MSG.jaEntrou);
  if (u.convite === 'fila') throw new ApiErro(422, MSG.naFila);
  u.convite = 'fila';
  u.quando = `pedido ${agora()}`;
  u.saiEm = Date.now() + TEMPO_NA_FILA_MS;
  return { id, mensagem: MSG.conviteNaFila };
}

export function mudarSessaoDoUsuario(banco: BancoGestao, id: string, minutos: number) {
  const u = pessoaDoId(banco, id);
  conferirSessao(minutos, u.perfil);
  u.sessaoMinutos = minutos === sessaoPadrao(u.perfil) ? null : minutos;
}

export function mudarAcessoDoUsuario(banco: BancoGestao, autor: string, id: string, ativo: boolean) {
  const u = pessoaDoId(banco, id);
  if (u.ativo === ativo) return;
  if (!ativo && id === autor) throw new ApiErro(422, MSG.proprio);
  if (!ativo && u.perfil === ADMIN && adminsAtivos(banco) < 2) throw new ApiErro(422, MSG.ultimoAdmin);
  u.ativo = ativo;
  if (ativo) u.quando = u.quandoAntes ?? null;
  else {
    u.quandoAntes = u.quando;
    u.quando = `desativado ${agora()}`;
  }
}
