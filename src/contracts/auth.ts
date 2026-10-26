// Contrato das rotas /api/auth/* do overnex-backend (login com e-mail e senha).
// Todas são POST com corpo JSON. Erros vêm como {"detail": "texto pronto para o usuário"}:
// - 401 em entrar: e-mail ou senha não conferem;
// - 429 em entrar e esqueci-senha: tentativas demais, com Retry-After (segundos) quando houver prazo;
// - 410 em definir-senha: link vencido ou já usado (o front mostra "Este link não vale mais");
// - 400 em definir-senha: senha fora da política (requisitos espelhados em src/auth/senha.ts).
// O refresh token fica num cookie httpOnly que só a API lê; o front guarda o access token só na memória.

export interface UsuarioAuth {
  nome: string | null;
  email: string;
}

/** Resposta de entrar, renovar e definir-senha. */
export interface SessaoAuth {
  accessToken: string;
  /** ISO 8601: quando o access token expira. */
  expiraEm: string;
  usuario: UsuarioAuth;
}

/** De onde veio o link do e-mail: convite (primeiro acesso) ou recuperação de senha. */
export type TipoLink = 'convite' | 'recuperacao';

export interface PedidoDefinirSenha {
  tokenHash: string;
  tipo: TipoLink;
  senha: string;
}
