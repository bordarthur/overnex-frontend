// Contrato das rotas /api/admin/* do overnex-backend: a área "Gestão" (Interno BORD). Espelho de
// api/app/admin/contrato.py (conferido contra o api/openapi.json em 10/11/2026; consultor só de
// leitura conferido em 25/11/2026).
//
// - Quem tem `gestao: true` na sessão abre: o Admin BORD, com tudo, e o Consultor por carteira, só para
//   ler as empresas da carteira dele. O que cada um vê vem em `permissoes` e `abas`;
// - quem não abre a Gestão recebe 403 {"detail": "Acesso negado."}. `GET /api/admin/usuarios` e todas
//   as gravações também são 403 para o consultor;
// - empresa que não existe: 404 {"detail": "Empresa não encontrada."} (para o consultor, 403: empresa
//   fora da carteira ou que não existe dá na mesma);
// - regra quebrada: 422 com o texto pronto em `detail` (corpo fora do formato também é 422, mas com
//   `detail` em lista: o front trata como erro genérico);
// - gravação com sucesso: 204 sem corpo; os dois POST de convite respondem 202 com `ConvitePedido`
//   (conferido contra api/app/admin/contrato.py em 13/11/2026).
// Todos os campos vêm sempre (null quando não há valor). A "empresa" da tela é o "cliente" daqui.

import type { Status } from './visaoGeral';

/** Status da Gestão: os três do farol e o neutro (desativado, desligada, indisponível). */
export type StatusGestao = Status | 'neutro';

export interface Rotulado {
  id: string;
  rotulo: string;
}

export interface ItemCliente {
  slug: string;
  nome: string;
}

// ---------- GET /api/admin/gestao ----------

export interface CamadaResumo {
  id: string;
  rotulo: string;
  // ativa | implantacao | desligada
  estado: string;
  estadoRotulo: string;
  status: StatusGestao;
}

export interface ClienteDaLista {
  slug: string;
  nome: string;
  // o setor da empresa, texto livre; null = não mostrar nada
  segmento: string | null;
  // uma por camada da implantação (a barra de pontos da lista)
  camadas: CamadaResumo[];
}

export interface PerfilDaGestao {
  id: string;
  rotulo: string;
  descricao: string;
  // quais empresas o perfil alcança, em texto ("As da carteira")
  clientes: string;
  sessaoPadraoMinutos: number;
  sessaoPadraoRotulo: string;
  pessoas: number;
}

export interface OpcaoSessao {
  minutos: number;
  rotulo: string;
  // só vale para o perfil Admin BORD
  soAdmin: boolean;
}

/** O que a pessoa pode fazer na Gestão. Admin BORD: tudo true; consultor: tudo false. */
export interface PermissoesGestao {
  // o botão "Nova empresa" da barra lateral
  criarEmpresa: boolean;
  // a área "Usuários" (e GET /api/admin/usuarios)
  usuarios: boolean;
}

export interface GestaoPayload {
  // para o consultor, só as empresas da carteira
  clientes: ClienteDaLista[];
  // para o consultor, vazio
  perfis: PerfilDaGestao[];
  // para o consultor, vazio
  sessoes: OpcaoSessao[];
  permissoes: PermissoesGestao;
}

// ---------- GET /api/admin/clientes/{slug} ----------

export interface ChipResumo {
  rotulo: string;
  status: StatusGestao;
}

export interface CamadaDoCliente extends CamadaResumo {
  // "Universal Básico", "Universal Completo"
  grupo: string;
  // o que falta para a camada ficar ativa
  pendencias: string[];
}

export interface FonteDoCliente {
  tabela: string;
  usadaPor: string[];
  linhas: number | null;
  // "13/10/2026", já em texto
  ultimaData: string | null;
  status: StatusGestao;
  statusRotulo: string;
  observacao: string | null;
}

export interface PainelDoCliente {
  codigo: string;
  nome: string;
  grupo: string;
  ligado: boolean;
  // false: sem dado, a chave de ligar fica travada (o motivo vem em `nota`). Ligado sempre desliga.
  podeLigar: boolean;
  status: StatusGestao;
  statusRotulo: string;
  nota: string | null;
}

export interface PerfilDaMatriz {
  id: string;
  rotulo: string;
  // coluna sempre marcada e travada (o Admin BORD)
  fixo: boolean;
}

export interface LinhaDaMatriz {
  codigo: string;
  nome: string;
  // por `PerfilDaMatriz.id`
  ve: Record<string, boolean>;
  // a chave "vê nomes", por `PerfilDaMatriz.id`; null nos painéis sem a chave. Só vale onde `ve` é
  // true (onde não é, vem false); o Admin BORD vem sempre true.
  nomes: Record<string, boolean> | null;
}

export interface MatrizDeAcesso {
  perfis: PerfilDaMatriz[];
  // só os painéis ligados
  linhas: LinhaDaMatriz[];
}

export interface AoEntrar {
  tipo: 'direto' | 'lista' | 'nada';
  rotulo: string;
}

export interface Situacao {
  // ativo | fila (convite pedido, ainda não saiu) | nao-enviado (o envio falhou) | convite (enviado) |
  // vencido | inativo | sem-empresa
  id: string;
  rotulo: string;
  // "último acesso hoje, 9h14", "enviado ontem, 16h10"
  quando: string;
  status: StatusGestao;
  // só em nao-enviado: por que o convite não saiu
  detalhe: string | null;
}

/** O botão que manda o convite de novo; o texto vem pronto ("Reenviar convite", "Tentar de novo"). */
export interface AcaoConvite {
  rotulo: string;
}

export interface UsuarioGestao {
  id: string;
  nome: string;
  email: string;
  perfil: Rotulado;
  // o Admin BORD: vê todas, sem vínculo (`clientes` vem vazio)
  todosOsClientes: boolean;
  clientes: ItemCliente[];
  aoEntrar: AoEntrar;
  sessaoMinutos: number;
  situacao: Situacao;
  acessos: { entradas30d: number; ultimo: string | null };
  // false: já desativado, ou o último Admin BORD ativo
  podeDesativar: boolean;
  // true: oferecer "Apagar usuário" (DELETE /api/admin/usuarios/{id}); só quem já está desativado
  podeApagar: boolean;
  // null: não oferecer (já entrou, está desativado ou o convite já está na fila)
  convite: AcaoConvite | null;
}

export interface UsuarioDoCliente extends UsuarioGestao {
  outrosClientes: ItemCliente[];
  // "5 de 8"
  paineisQueVe: string;
}

export interface PreferenciaDoCliente {
  id: string;
  rotulo: string;
  descricao: string;
  opcoes: Rotulado[];
  valor: string;
  editavel: boolean;
}

export interface Feriado {
  // AAAA-MM-DD
  data: string;
  nome: string;
}

export interface CargaDoCliente {
  // já em texto: "13/10", "9h00", "2 min 04 s"
  data: string;
  inicio: string;
  duracao: string | null;
  tabelas: number;
  status: StatusGestao;
  statusRotulo: string;
  observacao: string | null;
}

export interface GrupoDoMenu {
  grupo: string;
  itens: { nome: string }[];
}

export type IdAbaEmpresa = 'implantacao' | 'dados' | 'paineis' | 'preferencias' | 'acesso' | 'cargas';

export interface AbaEmpresa {
  id: IdAbaEmpresa;
  rotulo: string;
}

/** Os botões do cabeçalho da empresa. Admin BORD: true; consultor: false. */
export interface PermissoesEmpresa {
  // "Editar" (nome e setor)
  editar: boolean;
  // "Convidar usuário"
  convidar: boolean;
}

/**
 * Tudo das abas de uma empresa, numa resposta. Para o consultor, o que fica fora das abas dele vem
 * vazio: `paineis`, `usuarios`, `preferencias`, `feriados`, `cargas` e `menu` em [], e `acesso` sem
 * perfis nem linhas.
 */
export interface ClienteGestaoPayload {
  cliente: { slug: string; nome: string; segmento: string | null; logoUrl: string | null };
  // as abas que a pessoa vê, na ordem (admin: as 6; consultor: implantacao e dados)
  abas: AbaEmpresa[];
  permissoes: PermissoesEmpresa;
  // chips do cabeçalho (para o consultor, sem o de usuários)
  resumo: ChipResumo[];
  camadas: CamadaDoCliente[];
  fontes: FonteDoCliente[];
  paineis: PainelDoCliente[];
  acesso: MatrizDeAcesso;
  usuarios: UsuarioDoCliente[];
  preferencias: PreferenciaDoCliente[];
  feriados: Feriado[];
  cargas: CargaDoCliente[];
  // prévia do menu do Cliente principal
  menu: GrupoDoMenu[];
}

// ---------- GET /api/admin/usuarios ----------

export interface FiltroUsuarios {
  // "todos", o id de um perfil, "pendentes" (fila, nao-enviado, convite ou vencido) ou "sem-empresa"
  id: string;
  rotulo: string;
  total: number;
  // os que ficam em "Pedem atenção"
  atencao: boolean;
}

export interface UsuariosPayload {
  usuarios: UsuarioGestao[];
  filtros: FiltroUsuarios[];
  // texto da gaveta de convite: como o convite chega e em quanto tempo sai
  notaConvite: string;
}

// ---------- gravações ----------

/**
 * POST /api/admin/clientes: cria a empresa (201), com todas as camadas desligadas e sem pessoas. Sem `slug`, a API monta um a partir do nome (a tela não pede).
 */
export interface NovaEmpresa {
  nome: string;
  // o setor, texto livre; null = não informado
  segmento: string | null;
  slug: string | null;
}

/** PUT /api/admin/clientes/{slug} (204): troca o nome e o setor. O slug não muda. */
export interface MudancaEmpresa {
  nome: string;
  // null ou em branco = não informado
  segmento: string | null;
}

/** Resposta (201) de POST /api/admin/clientes. */
export interface EmpresaCriada {
  slug: string;
  nome: string;
  // texto do passo final: "Empresa criada. Já dá para convidar as pessoas; …"
  mensagem: string;
}

/**
 * POST /api/admin/usuarios: cria a pessoa e põe o convite na fila (202). O e-mail é o login e não
 * muda depois. `clientes` (slugs) pode ir vazio: a pessoa fica "Sem empresa"; no Admin BORD é
 * ignorado. `sessaoMinutos` null = o padrão do perfil.
 */
export interface NovoUsuario {
  email: string;
  nome: string;
  perfil: string;
  clientes: string[];
  sessaoMinutos: number | null;
}

/** Resposta (202) de POST /api/admin/usuarios e de POST /api/admin/usuarios/{id}/convite. */
export interface ConvitePedido {
  // a pessoa convidada
  id: string;
  // texto do passo final: "Convite na fila: sai em instantes."
  mensagem: string;
}

/** PUT /api/admin/usuarios/{id}. `sessaoMinutos` null = o padrão do perfil. */
export interface MudancaUsuario {
  nome: string;
  perfil: string;
  // slugs
  clientes: string[];
  sessaoMinutos: number | null;
}
