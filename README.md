# Overnex · frontend

Painéis da Overnex em React + TypeScript + Vite: a moldura (rail, cabeçalho, filtros, tema), a **Visão geral**, os painéis comerciais (**Vendas**, **Equipe comercial** e **Clientes e atendimentos**) e os financeiros (**Resultado** e **Receber e pagar**), alimentados por dado fictício enquanto a API não os entrega.

A referência visual e de comportamento é o mockup `overnex-mockup-visao-geral-m2_1_2.html` (Visão geral) e o `overnex-mockup-total-m2_0_1.html` (painéis comerciais e financeiros). Eles não ficam no repositório.

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

A empresa aberta é o `:clienteSlug` da URL (o "cliente" do contrato; na tela, "empresa"). As rotas são `/:clienteSlug/visao-geral`, `/:clienteSlug/vendas`, `/:clienteSlug/equipe-comercial`, `/:clienteSlug/clientes`, `/:clienteSlug/resultado`, `/:clienteSlug/receber-pagar`, `/:clienteSlug/fluxo-caixa` e `/:clienteSlug/pessoas`. `/gestao` é a Gestão (abaixo). O slug vai em `?cliente=` de `/api/sessao` e de toda rota `/api/telas/*` e entra em toda chave do cache; quem decide o acesso é a API (slug que a pessoa não pode abrir responde 403, e a tela mostra "sem acesso").

`/` decide para onde a pessoa vai, pela `/api/sessao` sem empresa escolhida (`Inicio`, em `src/app/Guardas.tsx`):

- `gestao: true` (Admin BORD): `/gestao`;
- `cliente` preenchido (uma empresa só): a primeira tela liberada dela, que é a Visão geral quando liberada;
- duas ou mais em `clientes`: a tela "Escolha a empresa". Depois, a troca é pelo seletor do menu (no rail estreito e no celular, a sigla da empresa);
- nenhuma: o texto de `aviso` e o botão Sair.

O menu só mostra as telas cujo código vem em `telas` da sessão (`src/contracts/telas.ts`), e rota de tela fora da lista mostra "sem acesso".

Enquanto não há API, o cliente mock (`src/api/mockClient.ts`) responde conforme `VITE_MOCK_CENARIO`:

- `completo` (padrão): as fixtures completas (`src/api/fixtures/visao-geral.json` e, nos painéis, `vendas.json`, `equipe-comercial.json`, `clientes.json`, `resultado.json`, `receber-pagar.json`, `fluxo-caixa.json` e `pessoas.json`). No Fluxo de caixa, a chave "Lançados + provisões" troca a projeção pelos cartões de `fluxo-caixa-provisoes.json`; os outros filtros não mudam os números
- `vazio`: sem seções, para ver o estado vazio
- `erro`: falha de servidor, para ver o estado de erro
- `sem-permissao`: 403, como a API responderia

No mock, quem está logado é a pessoa do login fake (ver "Login"), e a sessão, as telas liberadas e a Gestão saem de um banco na memória (`src/api/mockGestao.ts`, a partir de `fixtures/gestao.json`), com 5 empresas fictícias: a `demo` (a das fixtures das telas) e mais quatro, em que só o nome do cabeçalho muda. O que se grava na Gestão vale até recarregar a página.

Com `VITE_API_MODO=api` no `.env`, o front usa o cliente HTTP (`src/api/httpClient.ts`) em vez do mock. Em dev, o Vite repassa `/api` para a API local em `http://127.0.0.1:8001`, que sobe com `uv run fastapi dev --port 8001` (a API não tem CORS; em produção, front e API dividem o domínio).

### Pedidos adiantados

Para a Visão geral aparecer mais rápido (`src/api/adiantar.ts`):

- Ao abrir uma empresa, a Visão geral padrão dela (sem `mes`) é pedida assim que a sessão diz que ela está liberada, seja qual for a tela aberta; a tela usa a mesma query key e aproveita a resposta. Entrando por `/`, a sessão vem antes, porque é ela que dá o slug (antes de 10/11/2026 as duas saíam juntas); quem tem uma empresa só não pede a sessão de novo com o slug.
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

- `fake` (padrão): `src/auth/authFake.ts`. Qualquer e-mail entra, e o começo dele escolhe a pessoa (`src/auth/personasFake.ts`): `dora@…` é o Admin BORD, `caio@…` o consultor com duas empresas e `joana@…` a conta sem empresa (só no mock); os outros são o usuário de desenvolvimento. Senhas especiais: `errada` (erro de login), `bloqueada` (acesso pausado) e `expira` (sessão que cai no primeiro pedido depois de 30 s, para ver "Sua sessão terminou"). O link com `token_hash=vencido` mostra o de link vencido. O token é `fake:<object_id>`, que a API local aceita quando roda com `AMBIENTE=dev` e `AUTH_FAKE=1` (padrão: usuário de desenvolvimento do back, `…0000000001a1`, ligado à PJ Cortes; troque com `VITE_AUTH_FAKE_OBJECT_ID`). Para o login sobreviver ao reload, guarda só um indicador "logado" no `sessionStorage`, nunca o token.
- `api`: rotas `/api/auth/*` da API.

### Sessão por inatividade

Sem uso, a sessão cai, com aviso 2 minutos antes. O tempo é de cada pessoa e vem da API em `inatividadeSegundos` (entrar, renovar e definir senha): 4 h para os clientes, 8 h para o consultor e 24 h para o admin, ou o que a Gestão puser. Sem o campo, valem 30 min. `VITE_INATIVIDADE_MIN` passa por cima, para teste.

### Gestão (Interno BORD)

`/gestao`, só para o Admin BORD (`gestao: true` na sessão; as rotas `/api/admin/*` respondem 403 para os outros). Visual do mockup Gestão M2.1.0; contrato em `src/contracts/gestao.ts`. O código fica num arquivo separado do resto do app (`src/screens/gestao/`), que só a Gestão baixa.

- **Empresas** (`/gestao/empresas/:slug?aba=…`): Implantação (camadas), Prontidão dos dados, Painéis (liga e desliga, com a prévia do menu), Preferências (as que a API mandar e os feriados), Usuários e acesso (quem acessa e a matriz do que cada perfil vê) e Cargas.
- **Usuários** (`/gestao/usuarios?filtro=…`): a lista, os filtros que a API manda e a gaveta de edição (nome, perfil, empresas, sessão, desativar e reativar).

A API responde 204 nas gravações e não devolve o estado novo: depois de gravar, a Gestão é pedida de novo (e a sessão, quando muda painel, perfil ou pessoa). Regra quebrada vem como 422 com o texto pronto, mostrado como veio. Convidar gente nova não é pela tela: no lugar do botão fica a `notaConvite` da API.

## Regras do projeto

### O front não calcula

Todo número, status, posição de ponteiro, delta, média e texto vem pronto da API (contrato em `src/contracts/visaoGeral.ts`). O front só **formata** (`src/format/`) e **desenha**. Se uma tela precisar de uma conta de negócio, ela vai para a API, não para cá. A única contagem feita aqui é quantos indicadores de uma seção estão em cada status, para as pílulas da faixa, a partir do status que a API já mandou.

### Painéis por cartões

Os painéis comerciais (Vendas, Equipe comercial e Clientes), os financeiros (Resultado e Receber e pagar, no grupo **Financeiro** do menu) e o de Pessoas (grupo **Pessoas**, restrito a diretoria e RH na API) usam um contrato só (`src/contracts/painel.ts`, `GET /api/telas/{tela}`): destaques, KPIs, apoios, aviso, os filtros próprios da tela (ex.: Canal, Visão, Atraso) e uma lista de cartões tipados (`andamento-mes`, `fatores`, `contra-meta`, `tabela`, `destaques`, `graficos`, `faixas`, `curva-abc`, `matriz` e, nos financeiros, `dre`, `barra-partes`, `desvios`, `janelas`, `dois-lados`, `barras-horizontais` e, em Pessoas, `numero-grafico` e `lista-detalhe`), cada um com a largura na grade de 12. Com `explicacao`, o título do cartão ganha o botão "i", que abre o texto que a API mandou. A tela (`src/screens/paineis/PainelTela.tsx`) desenha os cartões na ordem em que vierem. Títulos, notas, nomes de canal, vendedor e linha, status e todo número vêm da API, e também os rótulos de mês: com o ano ("out-25") quando a série ou as colunas cruzam anos, só o mês ("out") quando ficam num ano só; o front calcula só geometria (largura de barra, escala dos eixos). Os filtros próprios vão na consulta pelo `id` (`?canal=varejo`), junto com `mes` e `empresa`. No Resultado, o chip "Comparar com" também vai (`?comparar=mes-anterior`). O cartão `graficos` pode trazer `visoes` (em Pessoas, uma por setor): a chave troca os gráficos no front, sem nova consulta. Na `lista-detalhe`, escolher uma linha mostra o gráfico dela ao lado. A DRE (`dre`) abre e fecha as contas no front, mas status, desvios e totais vêm prontos; a cascata recebe o início e o fim de cada barra.

### Nenhum nome de seção ou indicador fixo no código

A Visão geral desenha as seções e indicadores que vierem no JSON, na ordem em que vierem. Não escreva `if (secao.id === 'vendas')` nem nomes como "CMV de bovinos" em componente. Seção com `modulo` preenchido ganha a etiqueta "Módulo …" automaticamente. Textos fixos aceitos: rótulos de tela (título, pergunta), de tipo de cartão (o cartão `inadimplencia`) e de interface (estados, tema, filtros, "Ver painel").

A seção pode trazer um `seletor` (na Custos, "Linhas de custo"): a escolha vai em `PUT /api/telas/visao-geral/preferencias/{id}` e vale para o cliente inteiro, então o front pede de novo todas as Visões gerais em cache. No mock, a escolha fica na memória até recarregar, e o "Outros" só muda de nome (os números dele são os da fixture).

O cartão `provisoes` do Fluxo de caixa também grava: o período em `PUT /api/telas/{tela}/cartoes/{cartao}/periodo` e cada grupo (ligado e valor em reais, ou `null` para voltar ao sugerido) em `PUT /api/telas/{tela}/cartoes/{cartao}/grupos/{grupo}`, com a `empresa` da tela. Vale para todos que veem o painel; depois de gravar, o front pede a tela de novo, porque a API recalcula a projeção inteira. O campo mostra e recebe milhares ("630 mil"). No mock, as escolhas ficam na memória e só o cartão muda.

Um filtro da tela com `cartao` (a `projecao` do Fluxo de caixa) não aparece na barra: vira a chave no cabeçalho daquele cartão, e "Limpar filtros" não mexe nela.

### Segurança

- `innerHTML`, `outerHTML`, `insertAdjacentHTML` e `dangerouslySetInnerHTML` são proibidos no ESLint. Texto com destaque usa `Trecho[]` e o componente `Trechos`.
- `staticwebapp.config.json` aplica uma CSP restritiva (`default-src 'self'`, sem domínios externos, sem `unsafe-inline`). Por isso as fontes vêm do `@fontsource` e a marca é servida como arquivo (o Vite não gera `data:` URI: `assetsInlineLimit: 0`).
- O cliente na URL é só o pedido de quem navega (vai em `?cliente=`). Quem decide o acesso é a API.
- O access token nunca vai para `localStorage` ou `sessionStorage`; ao sair, o cache do TanStack Query é apagado. Os erros de login mostram o `detail` que a API mandou.
- Nada de segredo no código. `.env` só tem variáveis `VITE_` públicas, que vão para o navegador.

## Estrutura

```
src/
  app/         rotas, providers (QueryClient, Auth, Tema), moldura, CSS base
  screens/     telas (visao-geral/, paineis/, login/, entrada/, gestao/)
  charts/      gráficos em SVG próprio: Gauge, MiniTendencia, Linha, BarraEmpilhada e, nos painéis,
               Barras, Combo, Linhas, Empilhado, Dispersao, Degraus, Cascata (escolhidos em Grafico.tsx)
  components/  Rail, Cabecalho, BarraFiltros, Chip, Segmentado, FaixaSecao, Kpi, IndicadorGauge,
               CartaoInadimplencia, Pill, Tooltip, Assinatura, MarcaDagua, Marca, Trechos, EstadoTela,
               CampoTexto, Abas, Gaveta, CampoBusca, Selecao, OpcaoCartao
  contracts/   tipos do JSON (no futuro, gerados do OpenAPI)
  api/         client.ts (interface), httpClient.ts, mockClient.ts, fixtures/
  auth/        sessão (AuthProvider), clientes de /api/auth (real e fake), destino depois do login
  format/      formatadores pt-BR
  theme/       tokens.css, fontes, tema claro/escuro/automático, status
  assets/      logotipo e símbolo oficiais da Overnex (SVG extraído do mockup)
```

A marca é usada com `<use href="arquivo.svg#id">`: as letras do logotipo herdam `color`, o símbolo é sempre neon.
