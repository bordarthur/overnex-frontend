/**
 * Para onde ir depois de entrar. Só aceita caminho do próprio site: "/x", nunca "//site" ou "/\site",
 * que o navegador leria como outro domínio.
 */
export function destinoSeguro(voltar: string | null): string {
  if (!voltar || !voltar.startsWith('/') || voltar.startsWith('//') || voltar.startsWith('/\\')) return '/';
  return voltar;
}
