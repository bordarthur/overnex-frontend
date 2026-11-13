import type { PersonaFake } from '../auth/personasFake';
import type {
  CamadaDoCliente,
  ClienteGestaoPayload,
  FiltroUsuarios,
  FonteDoCliente,
  GestaoPayload,
  MudancaUsuario,
  PainelDoCliente,
  StatusGestao,
  UsuarioGestao,
  UsuariosPayload,
} from '../contracts/gestao';
import type { ClienteSessao, Empresa, PerfilId, PeriodoDisponivel, SessaoPayload } from '../contracts/sessao';
import { ApiErro } from './client';
import dados from './fixtures/gestao.json';

// O "banco" do mock: empresas, pessoas, painéis ligados e a matriz de acesso, na memória. Imita o que
// o back faz em /api/sessao e /api/admin/* (api/app/admin no overnex-backend): as mesmas regras e os
// mesmos textos de erro, para a Gestão funcionar sem API. Aqui o mock calcula, porque faz o papel da
// API; as telas continuam só desenhando o que recebem. Tudo volta ao começo ao recarregar a página.

const ADMIN = 'admin';
const SESSAO_MAXIMA_COMUM = 720;
const DOMINIO_ADMIN = '@bord.com.br';

export const MSG = {
  negado: 'Acesso negado.',
  cliente: 'Empresa não encontrada.',
  semCliente: 'Sua conta ainda não tem empresa. Fale com a BORD para liberar o acesso.',
  painel: 'Painel não encontrado.',
  perfilDaMatriz: 'Perfil não encontrado.',
  adminFixo: 'Admin BORD vê tudo e não pode ser alterado.',
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
  notaConvite:
    'Novos acessos são criados pela equipe BORD, pelo comando de cadastro: a pessoa recebe o ' +
    'convite por e-mail e cria a própria senha. Aqui se edita quem já tem acesso.',
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
  feriados: { data: string; nome: string }[];
  // escolhas gravadas (a mesma do seletor da Visão geral), por id
  preferencias: Record<string, string>;
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
  convite: string | null;
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
  return {
    usuario: { nome: u.nome, email: u.email },
    perfil: { id: u.perfil as PerfilId, rotulo: rotuloPerfil(u.perfil) },
    gestao: admin,
    clientes: lista.map(clienteSessao),
    cliente: escolhido ? clienteSessao(escolhido) : null,
    papel: escolhido ? papelDoPerfil(u.perfil) : null,
    empresas: escolhido ? EMPRESAS : [],
    telas: [...liberadas].sort(),
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
const grupoDoPainel = (p: PainelCatalogo) => dados.camadas.find((k) => k.id === p.camada)?.grupo ?? '';

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
    return { id: k.id, rotulo: k.rotulo, grupo: k.grupo, estado, estadoRotulo, status, pendencias };
  });
}

function paineis(c: ClienteMock): PainelDoCliente[] {
  return dados.paineis.map((p) => {
    const disponivel = temDado(c, p);
    return {
      codigo: p.codigo,
      nome: p.nome,
      grupo: grupoDoPainel(p),
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
  });
  const comoEsta = !u.ativo
    ? situacao('inativo', 'Desativado', u.quando ?? '', 'neutro')
    : u.convite === 'enviado'
      ? situacao('convite', 'Convite enviado', u.quando ?? '', 'atencao')
      : u.convite === 'vencido'
        ? situacao('vencido', 'Convite vencido', u.quando ?? '', 'critico')
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
  };
}

const todosOsUsuarios = (banco: BancoGestao) => porNome(banco.usuarios).map((u) => usuario(banco, u));

// ---------- GET /api/admin/* ----------

export function gestaoDoBanco(banco: BancoGestao): GestaoPayload {
  return {
    clientes: porNome(banco.clientes).map((c) => ({
      slug: c.slug,
      nome: c.nome,
      camadas: camadas(c).map(({ id, rotulo, estado, estadoRotulo, status }) => ({
        id,
        rotulo,
        estado,
        estadoRotulo,
        status,
      })),
    })),
    perfis: dados.perfis.map((p) => ({
      ...p,
      sessaoPadraoRotulo: rotuloSessao(p.sessaoPadraoMinutos),
      pessoas: banco.usuarios.filter((u) => u.perfil === p.id && u.ativo).length,
    })),
    sessoes: dados.sessoes.map((minutos) => ({
      minutos,
      rotulo: rotuloSessao(minutos),
      soAdmin: minutos > SESSAO_MAXIMA_COMUM,
    })),
  };
}

export function clienteDoBanco(banco: BancoGestao, slug: string): ClienteGestaoPayload {
  const c = clienteDoSlug(banco, slug);
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
    const grupo = grupoDoPainel(p);
    menu.set(grupo, [...(menu.get(grupo) ?? []), { nome: p.nome }]);
  }

  return {
    cliente: { slug: c.slug, nome: c.nome, logoUrl: null },
    resumo: [
      {
        rotulo: `${ativas} de ${listaCamadas.length} camadas ativas`,
        status: ativas === listaCamadas.length ? 'saudavel' : 'atencao',
      },
      { rotulo: `${ativos} ${ativos === 1 ? 'usuário' : 'usuários'}`, status: 'neutro' },
      ultima
        ? { rotulo: `Última carga: hoje, ${ultima.inicio}`, status: ultima.status as StatusGestao }
        : { rotulo: 'Sem carga ainda', status: 'critico' },
    ],
    camadas: listaCamadas,
    fontes: fontes(c),
    paineis: paineis(c),
    acesso: {
      perfis: dados.perfis.map((p) => ({ id: p.id, rotulo: p.rotulo, fixo: p.id === ADMIN })),
      linhas: noAr.map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        ve: Object.fromEntries(dados.perfis.map((k) => [k.id, k.id === ADMIN || ve(k.id, p.codigo)])),
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
      total: total((u) => u.situacao.id === 'convite' || u.situacao.id === 'vencido'),
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
