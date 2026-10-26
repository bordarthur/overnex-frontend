# Overnex · frontend

Painéis da Overnex em React + TypeScript + Vite. Esta primeira entrega traz a moldura (rail, cabeçalho, filtros, tema) e a tela **Visão geral**, alimentada por dado fictício.

A referência visual e de comportamento é o mockup `overnex-mockup-parcial-G1-m1.6.html`. Ele não fica no repositório, porque ainda está incompleto.

## Como rodar

Requer Node 20 ou mais novo.

```bash
npm install
cp .env.example .env   # opcional
npm run dev            # http://localhost:5173 → /demo/visao-geral
```

| Script              | O que faz                                    |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | servidor de desenvolvimento                  |
| `npm run build`     | checagem de tipos e build de produção (dist) |
| `npm run preview`   | serve o `dist`                               |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | `tsc --noEmit`                               |
| `npm test`          | Vitest + Testing Library                     |
| `npm run format`    | Prettier                                     |

### Rotas e dados de desenvolvimento

A rota é `/:clienteSlug/visao-geral`. `/` abre a Visão geral do cliente da sessão (`cliente.slug` de `/api/sessao`; no mock, `demo`). O slug serve só para navegar: não vai para a API nem entra na chave do cache. Enquanto não há API, o cliente mock (`src/api/mockClient.ts`) responde conforme `VITE_MOCK_CENARIO`:

- `completo` (padrão): a fixture completa (`src/api/fixtures/visao-geral.json`)
- `vazio`: sem seções, para ver o estado vazio
- `erro`: falha de servidor, para ver o estado de erro
- `sem-permissao`: 403, como a API responderia

Com `VITE_API_MODO=api` no `.env`, o front usa o cliente HTTP (`src/api/httpClient.ts`) em vez do mock. Em dev, o Vite repassa `/api` para a API local em `http://127.0.0.1:8000` (a API não tem CORS; em produção, front e API dividem o domínio).

### Pedidos adiantados

Para a Visão geral aparecer mais rápido (`src/api/adiantar.ts`):

- Assim que há sessão, `/api/sessao` e a Visão geral padrão (sem `mes`) saem juntas. A Visão geral sem `mes` não depende da sessão: a API usa o cliente e as empresas do vínculo. A tela usa a mesma query key e aproveita a resposta.
- Depois da primeira tela, os 2 meses anteriores de `periodos` são pedidos em segundo plano. Ao escolher um mês, o anterior a ele também. Um pedido adiantado por vez (cada Visão geral usa até 3 conexões do banco no back), só com a aba visível, e nada que já esteja fresco no cache.
- A Visão geral vale 15 min no cache (o mesmo prazo do cache da API). Ao trocar de mês, os números anteriores ficam na tela, esmaecidos, até os novos chegarem.
- Sair apaga o cache inteiro, inclusive o que foi adiantado.

### Login

O acesso é por e-mail e senha. A LANN cadastra cada usuário e ninguém cria conta sozinho. O front só fala com `/api/auth/*` (contrato em `src/contracts/auth.ts`). A API guarda as senhas no Supabase Auth e o refresh token num cookie httpOnly; o access token fica só na memória do front (`src/auth/AuthProvider.tsx`) e é renovado perto de vencer ou depois de um 401.

Telas (visual do mockup Login M2.0.0, em `src/screens/login/`):

- `/entrar`: o formulário de entrar. No mesmo endereço aparecem também o "Acesso pausado" (429, tentativas demais) e o "Sua sessão terminou" (a sessão caiu no meio do uso; pede só a senha da mesma conta).
- `/esqueci-senha`: pede o e-mail e mostra "Confira seu e-mail", com reenvio depois de 60 s.
- `/definir-senha?token_hash=…&type=invite|recovery`: o link dos e-mails de convite ("Crie seu acesso") e de recuperação ("Crie uma senha nova"). Link sem token ou recusado pela API (410) mostra "Este link não vale mais".

Sem sessão, qualquer outra rota leva a `/entrar?voltar=<tela>`; depois de entrar, a pessoa volta para essa tela (só caminhos do próprio site, ver `src/auth/destino.ts`). Os requisitos de senha mostrados enquanto a pessoa digita (`src/auth/senha.ts`) espelham a política do Supabase Auth; quem decide é a API.

`VITE_AUTH_MODO` escolhe o login:

- `fake` (padrão): `src/auth/authFake.ts`. Qualquer e-mail entra. Senhas especiais: `errada` (erro de login), `bloqueada` (acesso pausado) e `expira` (sessão que cai no primeiro pedido depois de 30 s, para ver "Sua sessão terminou"). O link com `token_hash=vencido` mostra o de link vencido. O token é `fake:<object_id>`, que a API local aceita quando roda com `AMBIENTE=dev` e `AUTH_FAKE=1` (padrão: usuário de desenvolvimento do back, `…0000000001a1`, ligado à PJ Cortes; troque com `VITE_AUTH_FAKE_OBJECT_ID`). Para o login sobreviver ao reload, guarda só um indicador "logado" no `sessionStorage`, nunca o token.
- `api`: rotas `/api/auth/*` da API.

## Regras do projeto

### O front não calcula

Todo número, status, posição de ponteiro, delta, média e texto vem pronto da API (contrato em `src/contracts/visaoGeral.ts`). O front só **formata** (`src/format/`) e **desenha**. Se uma tela precisar de uma conta de negócio, ela vai para a API, não para cá. A única contagem feita aqui é quantos indicadores de uma seção estão em cada status, para as pílulas da faixa, a partir do status que a API já mandou.

### Nenhum nome de seção ou indicador fixo no código

A Visão geral desenha as seções e indicadores que vierem no JSON, na ordem em que vierem. Não escreva `if (secao.id === 'vendas')` nem nomes como "CMV de bovinos" em componente. Seção com `modulo` preenchido ganha a etiqueta "Módulo …" automaticamente. Textos fixos aceitos: rótulos de tela (título, pergunta), de tipo de cartão (o cartão `inadimplencia`) e de interface (estados, tema, filtros).

### Segurança

- `innerHTML`, `outerHTML`, `insertAdjacentHTML` e `dangerouslySetInnerHTML` são proibidos no ESLint. Texto com destaque usa `Trecho[]` e o componente `Trechos`.
- `staticwebapp.config.json` aplica uma CSP restritiva (`default-src 'self'`, sem domínios externos, sem `unsafe-inline`). Por isso as fontes vêm do `@fontsource` e a marca é servida como arquivo (o Vite não gera `data:` URI: `assetsInlineLimit: 0`).
- O cliente na URL serve só para navegar. Quem decide o acesso é a API.
- O access token nunca vai para `localStorage` ou `sessionStorage`; ao sair, o cache do TanStack Query é apagado. Os erros de login mostram o `detail` que a API mandou.
- Nada de segredo no código. `.env` só tem variáveis `VITE_` públicas, que vão para o navegador.

## Estrutura

```
src/
  app/         rotas, providers (QueryClient, Auth, Tema), moldura, CSS base
  screens/     telas (visao-geral/, login/)
  charts/      gráficos em SVG próprio: Gauge, MiniTendencia, Linha, BarraEmpilhada
  components/  Rail, Cabecalho, BarraFiltros, Chip, Segmentado, FaixaSecao, Kpi, IndicadorGauge,
               CartaoInadimplencia, Pill, Tooltip, Assinatura, MarcaDagua, Marca, Trechos, EstadoTela,
               CampoTexto
  contracts/   tipos do JSON (no futuro, gerados do OpenAPI)
  api/         client.ts (interface), httpClient.ts, mockClient.ts, fixtures/
  auth/        sessão (AuthProvider), clientes de /api/auth (real e fake), destino depois do login
  format/      formatadores pt-BR
  theme/       tokens.css, fontes, tema claro/escuro/automático, status
  assets/      logotipo e símbolo oficiais da Overnex (SVG extraído do mockup)
```

A marca é usada com `<use href="arquivo.svg#id">`: as letras do logotipo herdam `color`, o símbolo é sempre neon.
