# Publicar o front no Cloudflare

O front roda num **Worker do Cloudflare**, que serve os arquivos do site e repassa `/api/*` para a API no **Azure App Service**. Para o navegador, front e API ficam no mesmo endereço: a API não tem CORS, a CSP só libera `connect-src 'self'` e o cookie do login (`ovx_refresh`) fica no domínio do front.

```
navegador ──► https://overnex.app                 Cloudflare: o site (dist) e o Worker
                      │ só /api/*
                      ▼
              https://<api>.azurewebsites.net     Azure App Service: a API (overnex-backend)
                      │
                      ▼
              Supabase de produção
```

| Arquivo                             | O que faz                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [wrangler.jsonc](wrangler.jsonc)    | configuração do Worker: a pasta `dist`, a volta para o `index.html` nas rotas do app e `/api/*` passando pelo Worker                                                       |
| [worker/index.ts](worker/index.ts)  | o repasse de `/api/*`: troca o endereço pelo da API, põe o IP de quem navega no `X-Forwarded-For` e o segredo no `X-Proxy-Segredo` (os que vierem de fora são descartados) |
| [public/\_headers](public/_headers) | CSP e os outros cabeçalhos de segurança dos arquivos do site; cache longo em `/assets/*`                                                                                   |
| [.env.production](.env.production)  | o build de produção usa a API e o login de verdade (`VITE_API_MODO=api`, `VITE_AUTH_MODO=api`)                                                                             |

A publicação é automática: cada push na `main` (o merge de uma `release/X.Y.Z`) faz o Cloudflare rodar o build e publicar.

## Antes de começar

1. **A API publicada no App Service**, respondendo em `https://<api>.azurewebsites.net/health`. O passo a passo dela fica no `overnex-backend`.
2. **O segredo do proxy.** Gere um valor aleatório. Ele vai igual em `PROXY_SEGREDO` no Worker (passo 3) e na API:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Enquanto a API não checar o cabeçalho, o Worker manda e ela ignora: não quebra nada.

3. **O domínio `overnex.app` no Cloudflare** (passo 5): o DNS dele precisa estar na mesma conta. Até lá, o endereço é `overnex-frontend.<sua-conta>.workers.dev`.

## 1. Criar o Worker ligado ao GitHub

No painel do Cloudflare (os nomes dos menus podem mudar um pouco):

1. **Workers & Pages → Create → Import a repository** (ou "Connect to Git").
2. Autorize o Cloudflare no GitHub e escolha o repositório `overnex-frontend`.
3. Preencha:

   | Campo                              | Valor                                                                         |
   | ---------------------------------- | ----------------------------------------------------------------------------- |
   | Project name                       | `overnex-frontend` (igual ao `name` do `wrangler.jsonc`, senão o build falha) |
   | Production branch                  | `main`                                                                        |
   | Build command                      | `npm run build`                                                               |
   | Deploy command                     | `npx wrangler deploy`                                                         |
   | Root directory                     | `/`                                                                           |
   | Builds for non-production branches | desligado (ver "Cuidados")                                                    |

   Não precisa de variável de build: o `.env.production` já liga a API e o login de verdade, e o `.node-version` diz o Node (24, o mesmo do CI).

4. Salve e deixe rodar o primeiro build. Ele publica mesmo sem as variáveis do passo 3; até lá, `/api` responde 503.

## 2. Conferir o build

Em **Workers & Pages → overnex-frontend → Deployments**, o build tem que terminar verde. Se falhar:

- "name mismatch" ou parecido: o nome do projeto não é `overnex-frontend`;
- erro de tipo, lint ou teste: o mesmo que o CI acusaria; rode `npm run build` na sua máquina.

## 3. Variáveis do Worker

Em **overnex-frontend → Settings → Variables and Secrets**:

| Nome            | Tipo   | Valor                                               |
| --------------- | ------ | --------------------------------------------------- |
| `API_ORIGEM`    | Text   | `https://<api>.azurewebsites.net`, sem barra no fim |
| `PROXY_SEGREDO` | Secret | o segredo gerado em "Antes de começar"              |

Elas valem na hora, sem novo build, e o deploy seguinte não as apaga (`keep_vars` no `wrangler.jsonc`). Pela linha de comando, o segredo também entra com `npx wrangler secret put PROXY_SEGREDO`.

## 4. Testar o endereço publicado

1. Abra o endereço do Worker: tem que aparecer a tela de login.
2. Abra direto `https://<front>/entrar` e dê F5: a tela volta (não pode dar 404).
3. Na aba **Network** do navegador, a resposta da página tem o cabeçalho `Content-Security-Policy`.
4. Abra `https://<front>/api/sessao`. A resposta diz se o repasse funciona:

   | Status | Quer dizer                                                                  |
   | ------ | --------------------------------------------------------------------------- |
   | 401    | **certo**: o Worker chegou à API, que pediu login                           |
   | 403    | a API recusou o segredo do proxy (`PROXY_SEGREDO` diferente nos dois lados) |
   | 502    | a API não respondeu: fora do ar, parada ou `API_ORIGEM` errado              |
   | 503    | `API_ORIGEM` não foi preenchido                                             |

5. Entre com um usuário de verdade e abra uma tela com dados.

## 5. Domínio (overnex.app)

1. **overnex-frontend → Settings → Domains & Routes → Add → Custom domain**: `overnex.app`. O Cloudflare cria o DNS e o certificado. Para o `www.overnex.app`, crie uma regra de redirecionamento (**Rules → Redirect Rules**) para `https://overnex.app`, mantendo o caminho.
2. Desligue o endereço `workers.dev` na mesma tela, para o site ter um endereço só.
3. Troque o endereço do front nos lugares que o conhecem:
   - `FRONT_URL=https://overnex.app` na API, no App Service (os links dos e-mails de convite e de senha nova usam ele);
   - no Supabase de produção, **Authentication → URL Configuration**: _Site URL_ `https://overnex.app` e `https://overnex.app/definir-senha` em _Redirect URLs_.

## Cuidados

- **O segredo do proxy é só do Worker e da API.** Nunca no código, no `.env` ou num `VITE_*` (tudo que é `VITE_` vai para o navegador).
- **Builds de outras branches ficam desligados**: cada um ganharia um endereço próprio falando com a API de produção, e os links dos e-mails continuariam apontando para o `FRONT_URL`.
- **Demonstração com o mock**: num Worker separado (outro nome no painel), com as variáveis de build `VITE_API_MODO=mock` e `VITE_AUTH_MODO=fake`. Com o login fake, qualquer e-mail entra: proteja o endereço com o **Cloudflare Access** (Zero Trust → Access → Applications), liberando só os e-mails de quem vai ver.
- **Voltar uma versão**: em **Deployments**, escolha a anterior e use "Rollback". As variáveis do passo 3 não mudam.

## Publicar da sua máquina, sem o GitHub

Serve para testar a configuração antes de ligar o GitHub. Publica no mesmo Worker do passo 1.

```bash
npx wrangler login     # abre o navegador para autorizar
npm run deploy         # build de produção e publicação
```

## Testar o Worker localmente

```bash
npm run preview:cloudflare   # build e o Worker em http://localhost:8787
```

Para o `/api` chegar a uma API, crie um `.dev.vars` (fora do Git) com `API_ORIGEM=http://127.0.0.1:8001`. Para o dia a dia continue no `npm run dev`, que usa o proxy do Vite.
