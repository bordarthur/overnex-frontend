/**
 * Worker do Cloudflare: serve o site (a pasta dist) e repassa /api/* para a API no Azure App Service.
 *
 * Para o navegador, front e API ficam no mesmo domínio: a API não tem CORS, a CSP só libera
 * `connect-src 'self'` e o cookie do refresh (ovx_refresh, Path=/api/auth) fica no domínio do front.
 *
 * O Cloudflare só chama este código em /api/* (`run_worker_first` no wrangler.jsonc); o resto vai
 * direto para os arquivos do site, com a volta para o index.html nas rotas do app.
 */

export interface Env {
  ASSETS: Fetcher;
  /** Endereço da API, sem barra no fim. Ex.: https://overnex-api.azurewebsites.net */
  API_ORIGEM?: string;
  /** Segredo combinado com a API, mandado no cabeçalho X-Proxy-Segredo. Vazio: não manda. */
  PROXY_SEGREDO?: string;
}

// Cabeçalhos que quem navega poderia forjar e que só o Worker pode definir.
const CABECALHOS_DO_PROXY = [
  'x-proxy-segredo',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'forwarded',
];

export function ehApi(caminho: string) {
  return caminho === '/api' || caminho.startsWith('/api/');
}

export async function repassar(request: Request, env: Env, chamar: typeof fetch = fetch) {
  // Sem a API configurada, responde sem corpo: o front mostra "Erro 503 da API."
  if (!env.API_ORIGEM) return new Response(null, { status: 503 });

  const url = new URL(request.url);
  const destino = new URL(url.pathname + url.search, env.API_ORIGEM);

  const headers = new Headers(request.headers);
  // o Host certo é o da API, que o fetch tira do endereço
  headers.delete('host');
  for (const nome of CABECALHOS_DO_PROXY) headers.delete(nome);
  // O IP de quem navega, que a API usa no limite de tentativas do login. Sobrescreve, não acrescenta:
  // o que veio de fora não vale.
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) headers.set('x-forwarded-for', ip);
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', 'https');
  if (env.PROXY_SEGREDO) headers.set('x-proxy-segredo', env.PROXY_SEGREDO);

  const temCorpo = request.method !== 'GET' && request.method !== 'HEAD';
  try {
    return await chamar(destino, {
      method: request.method,
      headers,
      body: temCorpo ? request.body : null,
      // um redirecionamento da API volta para o navegador como veio
      redirect: 'manual',
    });
  } catch {
    // API fora do ar ou endereço errado: o front mostra "Erro 502 da API."
    return new Response(null, { status: 502 });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (ehApi(pathname)) return repassar(request, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
