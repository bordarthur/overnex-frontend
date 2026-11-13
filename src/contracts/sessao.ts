// Contrato de GET /api/sessao: o que a moldura precisa antes de abrir uma tela.
// Espelho do SessaoPayload do overnex-backend (api/app/sessao/router.py). Todos os campos vêm sempre.
//
// "Cliente" aqui é a "empresa" que a pessoa escolhe na tela (Nilo Maia, PJ). As `empresas` são outra
// coisa: os CNPJs dentro do cliente escolhido (o chip "Empresa" dos filtros).

/** Os 4 perfis fixos do Overnex. Só o `admin` (Admin BORD) abre a Gestão e vê todos os clientes. */
export type PerfilId = 'admin' | 'consultor' | 'cliente_principal' | 'cliente_usuario';

export const PERFIL_ADMIN: PerfilId = 'admin';

export interface Empresa {
  id: string;
  nome: string;
}

export interface PeriodoDisponivel {
  // AAAA-MM, o valor que vai em ?mes= da tela
  id: string;
  // "Outubro de 2026"
  rotulo: string;
  // ISO 8601: data dos dados mais recentes do mês
  dadosAte: string;
}

export interface ClienteSessao {
  nome: string;
  sigla: string;
  logoUrl: string | null;
  // o :clienteSlug da URL e o valor de ?cliente= nas chamadas
  slug: string;
}

export interface SessaoPayload {
  usuario: { nome: string | null; email: string };
  perfil: { id: PerfilId; rotulo: string };
  // a pessoa abre a Gestão (/api/admin/*): só o Admin BORD
  gestao: boolean;
  // os clientes que a pessoa pode abrir, por nome (o seletor de empresa)
  clientes: ClienteSessao[];
  // o cliente escolhido. Sem ?cliente=, só vem preenchido para quem tem um cliente só; com null,
  // `papel` vem null e `empresas`, `telas` e `periodos` vêm vazios
  cliente: ClienteSessao | null;
  papel: string | null;
  // empresas (CNPJs) do vínculo do usuário no cliente escolhido
  empresas: Empresa[];
  // códigos das telas ligadas no cliente e liberadas à pessoa (ex.: "VG-01")
  telas: string[];
  // meses com dados, do mais recente para o mais antigo
  periodos: PeriodoDisponivel[];
  // texto pronto para quem não tem cliente nenhum; null nos outros casos
  aviso: string | null;
}
