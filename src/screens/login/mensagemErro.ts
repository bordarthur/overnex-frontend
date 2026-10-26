import { ApiErro } from '../../api/client';

/** Texto do erro: o `detail` que a API mandou, ou um aviso de falha de rede. */
export function mensagemErro(erro: unknown): string {
  if (erro instanceof ApiErro) return erro.message;
  return 'Não conseguimos falar com o servidor. Confira a conexão e tente de novo.';
}
