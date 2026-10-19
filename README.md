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

A rota é `/:clienteSlug/visao-geral`; `/` redireciona para `/demo/visao-geral`. Enquanto não há API, o cliente mock (`src/api/mockClient.ts`) responde por slug:

- `demo`: a fixture completa (`src/api/fixtures/visao-geral.json`)
- `vazio`: sem seções, para ver o estado vazio
- `erro`: falha de servidor, para ver o estado de erro
- qualquer outro: sem permissão (403), como a API responderia

Com `VITE_API_MODO=api` no `.env`, o front usa o cliente HTTP (`src/api/httpClient.ts`) em vez do mock. Em dev, o Vite repassa `/api` para a API local em `http://127.0.0.1:8000` (a API não tem CORS; em produção, front e API dividem o domínio).

Não há login nesta entrega: o `AuthProviderFake` devolve sempre um usuário de desenvolvimento, com o token `fake:<object_id>` que a API local aceita quando roda com `AMBIENTE=dev` e `AUTH_FAKE=1`. O padrão é a Ana do seed do back; troque com `VITE_AUTH_FAKE_OBJECT_ID`. O login com o Microsoft Entra entra em outra entrega.

## Regras do projeto

### O front não calcula

Todo número, status, posição de ponteiro, delta, média e texto vem pronto da API (contrato em `src/contracts/visaoGeral.ts`). O front só **formata** (`src/format/`) e **desenha**. Se uma tela precisar de uma conta de negócio, ela vai para a API, não para cá. A única contagem feita aqui é quantos indicadores de uma seção estão em cada status, para as pílulas da faixa, a partir do status que a API já mandou.

### Nenhum nome de seção ou indicador fixo no código

A Visão geral desenha as seções e indicadores que vierem no JSON, na ordem em que vierem. Não escreva `if (secao.id === 'vendas')` nem nomes como "CMV de bovinos" em componente. Seção com `modulo` preenchido ganha a etiqueta "Módulo …" automaticamente. Textos fixos aceitos: rótulos de tela (título, pergunta), de tipo de cartão (o cartão `inadimplencia`) e de interface (estados, tema, filtros).

### Segurança

- `innerHTML`, `outerHTML`, `insertAdjacentHTML` e `dangerouslySetInnerHTML` são proibidos no ESLint. Texto com destaque usa `Trecho[]` e o componente `Trechos`.
- `staticwebapp.config.json` aplica uma CSP restritiva (`default-src 'self'`, sem domínios externos, sem `unsafe-inline`). Por isso as fontes vêm do `@fontsource` e a marca é servida como arquivo (o Vite não gera `data:` URI: `assetsInlineLimit: 0`).
- O cliente na URL serve só para navegar. Quem decide o acesso é a API.
- Nada de segredo no código. `.env` só tem variáveis `VITE_` públicas, que vão para o navegador.

## Estrutura

```
src/
  app/         rotas, providers (QueryClient, Auth, Tema), moldura, CSS base
  screens/     telas (visao-geral/)
  charts/      gráficos em SVG próprio: Gauge, MiniTendencia, Linha, BarraEmpilhada
  components/  Rail, Cabecalho, BarraFiltros, Chip, Segmentado, FaixaSecao, Kpi, IndicadorGauge,
               CartaoInadimplencia, Pill, Tooltip, Assinatura, MarcaDagua, Marca, Trechos, EstadoTela
  contracts/   tipos do JSON (no futuro, gerados do OpenAPI)
  api/         client.ts (interface), httpClient.ts, mockClient.ts, fixtures/
  auth/        interface de autenticação e implementação fake
  format/      formatadores pt-BR
  theme/       tokens.css, fontes, tema claro/escuro/automático, status
  assets/      logotipo e símbolo oficiais da Overnex (SVG extraído do mockup)
```

A marca é usada com `<use href="arquivo.svg#id">`: as letras do logotipo herdam `color`, o símbolo é sempre neon.
