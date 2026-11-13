// Contrato das rotas /api/admin/* do overnex-backend: a área "Gestão" (Interno BORD), só para o
// Admin BORD. Espelho de api/app/admin/contrato.py (conferido contra o api/openapi.json em 10/11/2026).
//
// - Quem não é Admin BORD recebe 403 {"detail": "Acesso negado."};
// - empresa que não existe: 404 {"detail": "Empresa não encontrada."};
// - regra quebrada: 422 com o texto pronto em `detail` (corpo fora do formato também é 422, mas com
//   `detail` em lista: o front trata como erro genérico);
// - gravação com sucesso: 204 sem corpo.
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

export interface GestaoPayload {
  clientes: ClienteDaLista[];
  perfis: PerfilDaGestao[];
  sessoes: OpcaoSessao[];
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
  // ativo | convite | vencido | inativo | sem-empresa
  id: string;
  rotulo: string;
  // "último acesso hoje, 9h14", "enviado ontem, 16h10"
  quando: string;
  status: StatusGestao;
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

/** Tudo das abas de uma empresa, numa resposta. */
export interface ClienteGestaoPayload {
  cliente: { slug: string; nome: string; logoUrl: string | null };
  // chips do cabeçalho
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
  // "todos", o id de um perfil, "pendentes" (situação convite ou vencido) ou "sem-empresa"
  id: string;
  rotulo: string;
  total: number;
  // os que ficam em "Pedem atenção"
  atencao: boolean;
}

export interface UsuariosPayload {
  usuarios: UsuarioGestao[];
  filtros: FiltroUsuarios[];
  // fica no lugar do botão "Convidar": o cadastro de login é por comando da BORD
  notaConvite: string;
}

// ---------- gravações ----------

/** PUT /api/admin/usuarios/{id}. `sessaoMinutos` null = o padrão do perfil. */
export interface MudancaUsuario {
  nome: string;
  perfil: string;
  // slugs
  clientes: string[];
  sessaoMinutos: number | null;
}
