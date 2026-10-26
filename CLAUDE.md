# Overnex frontend

Painéis de gestão (BI) para clientes da LANN. Este repositório é só o front; a API fica no `overnex-backend` (`C:\Users\arthur bord\Documents\overnex-backend`). Detalhes de rotas, login, mock e estrutura de pastas estão no `README.md`; o que está feito e pendente, no `TODO.md`.

## Combinados

- Tudo em português: código, comentários, textos da tela, commits e PRs.
- Não fazer commit, push, merge nem abrir PR sem pedido.
- Ao terminar um trabalho, rodar as checagens abaixo e dizer o que foi e o que não foi testado, inclusive se abriu ou não no navegador.
- Mudança que depende do back: escrever um prompt pronto para o usuário colar na sessão do `overnex-backend`, com o contrato esperado (rota, corpo, status e textos de erro).

## Stack e comandos

React 19 + TypeScript + Vite 7 + TanStack Query 5 + react-router 7 (modo declarativo). Testes com Vitest + Testing Library (sem MSW). CSS puro, um arquivo ao lado de cada componente, com os tokens de `src/theme/tokens.css`.

```bash
npm run dev   # http://localhost:5173
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

O CI (`.github/workflows/ci.yml`, job `verificar`) roda as mesmas checagens.

## Regras do código

- **O front não calcula.** Todo número, status, texto e rótulo de dado vem pronto da API; o front só formata e desenha.
- **Nada fixo de seção ou indicador** no código: os nomes vêm do contrato.
- **Segurança:**
  - CSP restritiva em `staticwebapp.config.json`: nada de domínio externo, `data:` URI, Google Fonts ou HTML cru;
  - o access token fica só na memória, nunca em `localStorage` ou `sessionStorage`;
  - o slug do cliente na URL serve só para navegar: quem decide o acesso é a API, pelo token.
- **Cores:** status usa só `--ok` (azul), `--warn` e `--crit`. As cores da marca (`--neon`, `--verde`) nunca indicam status.
- **Mockups de referência** (`overnex-mockup-parcial-G1-m1.6`, `overnex-mockup-login-m2_0_0`) não ficam no repositório. Quando o usuário traz um mockup, segue-se o mockup e avisa-se o que não encaixa nas regras ou no back, para ele decidir.

## Ambiente de desenvolvimento

- **Esta máquina (Windows):** não tem Docker, Postgres nem Python. Os testes com banco do back nunca rodaram aqui.
- **Fonte dos dados** (`.env`, ver `.env.example`):
  - `VITE_API_MODO=mock` usa a fixture, com o estado da tela escolhido por `VITE_MOCK_CENARIO`;
  - `VITE_API_MODO=api` usa a API local, que o Vite repassa de `/api` para `127.0.0.1:8000`.
- **Login** (`VITE_AUTH_MODO`):
  - `fake` (padrão) aceita qualquer e-mail. Senhas especiais: `errada`, `bloqueada` e `expira`. O link `/definir-senha?token_hash=vencido&type=recovery` mostra o link vencido;
  - `api` usa `/api/auth/*`.
- **Cliente e usuário de desenvolvimento:** PJ Cortes (slug `pj-cortes`, uma empresa) e `diretoria@lannconsult.com.br`. O token fake é `fake:0d000000-0000-4000-8000-0000000001a1`; a API local só o aceita com `AMBIENTE=dev` e `AUTH_FAKE=1`.

## Decisões em vigor

- **Login:**
  - é por e-mail e senha, sem Microsoft Entra por enquanto;
  - a LANN cadastra os usuários; ninguém cria conta sozinho;
  - o back usa o Supabase Auth e guarda o refresh token num cookie httpOnly;
  - o contrato está em `src/contracts/auth.ts`;
  - o visual segue o mockup Login M2.0.0. As partes que ficaram de fora estão em "A decidir" no `TODO.md`.
- **Cliente por usuário:** cada usuário vê um cliente só. A visão de administrador da LANN, com vários clientes, fica para depois.
- **Visão geral sem slug:** `obterVisaoGeral` e a query key não usam o slug.
- **Pedidos adiantados** (`src/api/adiantar.ts`):
  - a Visão geral padrão sai junto com `/api/sessao`;
  - os meses vizinhos são pedidos um por vez, só com a aba visível, e valem 15 min no cache;
  - sair apaga o cache inteiro.

## Git

- **Features:** `feat/<nome>` ou `feature/<nome>`, criadas a partir da `dev`, com PR para a `dev`.
- **Produção:** `release/X.Y.Z` criada a partir da `dev`, com PR para a `main`. Nunca abrir PR `dev` → `main` nem fazer merge direto: a automação (`pr-automacao.yml`) só age em branches `feat/`, `feature/`, `release/` e `hotfix/`.
- **Automação:** ainda depende do GitHub App (`APP_ID` e `APP_PRIVATE_KEY`) e dos rulesets, que não foram configurados. Ver `CONTRIBUTING.md`.

## Lista de tarefas

`TODO.md`, na raiz, é a lista viva do projeto. Sempre que uma tarefa for concluída ou surgirem tarefas novas (TODOs no código, pendências, decisões abertas), atualize o `TODO.md` no mesmo trabalho:

- tarefa concluída sai de "A fazer" ou "Em andamento" e vai para "Concluído", com a data (dd/mm/aaaa);
- tarefa nova entra em "A fazer"; questão que depende do usuário entra em "A decidir";
- atualize a linha "Última atualização";
- cada item aponta o arquivo relacionado quando houver.
