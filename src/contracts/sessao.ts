// Contrato de GET /api/sessao: o que a moldura precisa antes de abrir uma tela.
// Espelho do SessaoPayload do overnex-backend (api/app/sessao/router.py).

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

export interface SessaoPayload {
  usuario: { nome: string | null; email: string };
  cliente: { nome: string; sigla: string; logoUrl: string | null; slug: string };
  papel: string;
  // empresas do vínculo do usuário
  empresas: Empresa[];
  // códigos das telas liberadas (ex.: "VG-01")
  telas: string[];
  // meses com dados, do mais recente para o mais antigo
  periodos: PeriodoDisponivel[];
}
