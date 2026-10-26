# TODO · Overnex frontend

Lista viva do projeto. Atualizada ao fim de cada tarefa: o que foi feito vai para **Concluído** (com data), o que surgiu entra em **A fazer** ou **A decidir**.

Última atualização: 23/10/2026

## Em andamento

- [ ] **Login com e-mail e senha: ligar à API.** O front está pronto e funciona com o login fake ([AuthProvider.tsx](src/auth/AuthProvider.tsx), [authClient.ts](src/auth/authClient.ts), telas em [screens/login/](src/screens/login/)). Falta o back criar `/api/auth/*` no contrato de [auth.ts](src/contracts/auth.ts) (Supabase Auth com refresh em cookie httpOnly; prompt entregue em 23/10/2026) e testar com `VITE_AUTH_MODO=api`: entrar, recarregar e continuar logado, renovação depois de vencer o token, sair, convite e recuperação de senha pelo e-mail. Com o mockup Login M2.0.0, o back também precisa:
  - mandar 429 com `Retry-After` quando houver tentativas demais;
  - mandar 410 para link vencido ou já usado;
  - usar os textos do mockup ("E-mail ou senha não conferem. Confira os dois e tente de novo.", "Foram 5 tentativas com a senha errada.");
  - configurar a política de senha igual a [senha.ts](src/auth/senha.ts) (8 caracteres, maiúscula e número).
- [ ] **Conferir as telas de acesso no navegador** (claro, escuro, celular em 360 px, movimento reduzido) contra o mockup Login M2.0.0. Os testes cobrem o comportamento, mas ninguém viu as telas ainda.

- [ ] **Medir o ganho dos pedidos adiantados no navegador.** Aba Network com a API local: tempo do login até a primeira tela e da troca de mês, antes e depois. Não foi medido em 23/10/2026 porque a API local respondia 500 em `/api/sessao` e na Visão geral. Para o "antes", rodar o commit anterior a esta mudança. Ver [adiantar.ts](src/api/adiantar.ts).

## A fazer

- [ ] **Configurar o GitHub para colaboradores** (front e back), como em [CONTRIBUTING.md](CONTRIBUTING.md): branch `dev`, GitHub App com `APP_ID` e `APP_PRIVATE_KEY`, rulesets em `main` e `dev` (PR com 1 aprovação, CODEOWNERS, checks obrigatórios `verificar` no front e `api` e `carga` no back, App e Admin no bypass) e colaboradores com papel Write. Sem isso, o CI roda mas a automação de PR falha no primeiro passo.

- [ ] **Slug da URL diferente do cliente da sessão.** Na API, o cliente sai do token: em `/outro-slug/visao-geral` a pessoa vê os dados do próprio cliente com outro nome na URL. Redirecionar para `/${sessao.cliente.slug}/…` quando forem diferentes. Ver [Guardas.tsx](src/app/Guardas.tsx).
- [ ] **Visão de administrador da LANN.** Um usuário que vê vários clientes e escolhe qual abrir. Precisa de: back resolver o cliente pela URL para usuários `tipo='lann'` (hoje quem tem mais de um cliente é barrado no passo 2), `/api/sessao` listar os clientes e um seletor de cliente no front. Por ora o usuário da diretoria fica só na PJ Cortes.
- [ ] **Filtro "Comparar com" de verdade.** Período e Empresa já vêm de `/api/sessao` e vão na consulta; "Comparar com" ainda só troca o rótulo (a API não tem esse parâmetro). Ver [filtrosDemo.ts](src/screens/visao-geral/filtrosDemo.ts).
- [ ] **Clique no indicador.** O cartão deve virar link para a tela em `telaDestino` assim que ela existir. Ver [IndicadorGauge.tsx](src/components/IndicadorGauge.tsx).
- [ ] **Logo do cliente no co-branding.** A CSP só aceita `img-src 'self'`, então a API precisa servir o logo. Ver [Cabecalho.tsx](src/components/Cabecalho.tsx).

### Integração com o banco (análise do overnex-backend em 16/10/2026)

O que o back precisa criar está na seção "Para o front consumir (Visão geral)" do `TODO.md` do `overnex-backend`. Do lado do front:

- [ ] **Testar o cliente HTTP contra a API local** com `VITE_API_MODO=api`, quando a API subir nesta máquina (depende do item abaixo).
- [ ] **Gerar os tipos do contrato a partir do OpenAPI do back**, quando o contrato da Visão geral existir lá, e apagar `src/contracts/visaoGeral.ts` escrito à mão.
- [ ] **Resto do `GET /api/sessao`:** cliente e logo no cabeçalho e telas liberadas no menu. Os filtros Período e Empresa já usam a sessão ([filtros.ts](src/screens/visao-geral/filtros.ts)).
- [ ] **`?mes=` no back.** O front já manda `mes` (AAAA-MM) e `empresa` na Visão geral, mas a API ainda ignora `mes` e lista só o mês do snapshot em `/api/sessao`: escolher outro mês devolve os mesmos números. Pedido ao back em 22/10/2026.
- [ ] **Telas que lerem `GET /api/dados/{tabela}`:** nenhuma lê hoje. Quando alguma ler, pegar nomes de tabela e coluna da PJ Cortes (`f_vendas_pj`, `d_cliente_pj`…), não os da Nilo Maia, que foram apagados do banco.
- [ ] **Conferir Resultado e Financeiro com a API** depois da primeira carga da PJ Cortes. As duas seções agora vêm do back, com regras provisórias, e mostram menos que a fixture: sem "EBITDA projetado", "Dívida líquida / EBITDA", "Saldo em conta", "Cobertura de caixa" e "Ciclo de caixa" (o back não tem fonte para eles). Ver o `TODO.md` do `overnex-backend`.
- [ ] **Ambiente local da API.** Esta máquina não tem Docker nem Supabase CLI, e o `api/.env` do back não existe.

## A decidir

- [ ] **Partes do mockup Login M2.0.0 que ficaram de fora** (decidir com o usuário). Ver [LoginTela.tsx](src/screens/login/LoginTela.tsx) e [LayoutAcesso.tsx](src/screens/login/LayoutAcesso.tsx):
  - entrar com Microsoft e Google;
  - código de verificação por e-mail (2FA);
  - "Manter conectado neste aparelho";
  - escolher empresa depois de entrar;
  - tela "Preparando os números";
  - tela "Senha salva" (hoje a pessoa entra direto);
  - no convite, quem convidou, nome e e-mail;
  - aceite dos termos;
  - links Privacidade, Termos de uso e Ajuda;
  - contagem "Restam N tentativas".
- [ ] **Textos do mockup de login a confirmar:** "atualizados todo dia às 9h" e "equipe" na coluna da marca; "Um produto BORD", "consultor BORD" e "overnex.app" (o resto do projeto fala em LANN). Ver [LayoutAcesso.tsx](src/screens/login/LayoutAcesso.tsx).

- [ ] **Quantos meses adiantar.** Hoje são os 2 anteriores ao mais recente e o anterior ao mês escolhido, um pedido por vez. Se o back ficar mais rápido ou o banco aguentar mais conexões, vale adiantar mais (ou também a empresa mais usada)? Ver [adiantar.ts](src/api/adiantar.ts).

- [ ] **Microsoft Entra.** Fora por enquanto (decisão de 23/10/2026: login com e-mail e senha). Se voltar, entra como outro `AuthClient` ao lado de [authClient.ts](src/auth/authClient.ts); a validação do token do Entra continua no back, desligada.

- [ ] **Histórico x espaço no banco.** A Visão geral pede 6 meses de tendência e 12 de inadimplência, mas as tabelas de movimento estão com janela de 1 mês (Supabase gratuito perto de 500 MB). Guardar agregados mensais, aumentar a janela ou mudar de plano?
- [ ] **Regras de negócio dos indicadores.** Qual tabela e qual conta geram cada indicador (meta, orçado, CMV por linha, cobertura de caixa, ciclo de caixa, faixas do farol). O back ainda não tem nenhuma regra definida.
- [ ] **Dias úteis da seção Vendas.** "Projeção de fechamento" e "A realizar por dia útil" dependem de quais dias contam: sábado entra? Feriados só nacionais ou também estaduais e municipais por empresa? O back ainda não tem calendário. A regra do status desses dois cards também está em aberto. Ver o `vendas.py` do back.
- [ ] **Contra qual banco testar localmente.** Supabase local (precisa de Docker) ou o de produção (precisa da senha do `api_site`, ainda não definida).

- [ ] **Legenda dos velocímetros.** Foi incluída a pedido, mas o mockup não a mostra e ela deixa cada cartão 48px mais alto. Manter ou tirar?
- [ ] **Título e subtítulo do cartão de Inadimplência.** Hoje estão fixos no componente porque o contrato não os traz. Incluir no contrato?
- [ ] **Aviso "este filtro só muda o rótulo".** O mockup mostra um aviso ao trocar filtro; ficou de fora. Incluir enquanto os filtros não funcionam?
- [ ] **Botão "Mostrar fontes de dados".** Ficou de fora desta entrega. Entra em qual?

## Concluído

- [x] 23/10/2026 · Telas de acesso no visual do mockup Login M2.0.0:
  - coluna da marca com a ilustração animada;
  - Entrar, com aviso de Caps Lock e validação do e-mail;
  - Acesso pausado (429), com contagem;
  - Sua sessão terminou;
  - Redefinir a senha e Confira seu e-mail, com reenvio;
  - Crie seu acesso e Crie uma senha nova, com os requisitos acendendo;
  - Este link não vale mais.

  Ver [screens/login/](src/screens/login/), [CampoTexto.tsx](src/components/CampoTexto.tsx) e [senha.ts](src/auth/senha.ts).

- [x] 23/10/2026 · Pedidos adiantados da Visão geral:
  - a Visão geral padrão sai junto com `/api/sessao` assim que há sessão;
  - os meses vizinhos são pedidos em segundo plano, um por vez e só com a aba visível;
  - 15 min de validade no cache;
  - na troca de mês, os números anteriores ficam na tela com o aviso "Carregando o período escolhido…".

  O slug saiu da query key e da chamada `obterVisaoGeral`; os estados do mock passaram a vir de `VITE_MOCK_CENARIO`. Ver [adiantar.ts](src/api/adiantar.ts), [useVisaoGeral.ts](src/api/useVisaoGeral.ts), [useSessao.ts](src/api/useSessao.ts) e [mockClient.ts](src/api/mockClient.ts).

- [x] 23/10/2026 · Login no front com e-mail e senha: telas Entrar, Esqueci minha senha e Definir senha (convite e recuperação), rotas protegidas com volta para a tela pedida, usuário e Sair no rail, "Entrar com outra conta" no estado sem permissão, renovação do token depois de um 401 e login fake (`VITE_AUTH_MODO`). `/` passa a abrir o cliente da sessão, e `VITE_CLIENTE_PADRAO` e o `AuthProviderFake` saíram. Ver [App.tsx](src/app/App.tsx), [Guardas.tsx](src/app/Guardas.tsx), [AuthProvider.tsx](src/auth/AuthProvider.tsx) e [CampoTexto.tsx](src/components/CampoTexto.tsx).

- [x] 23/10/2026 · CI no GitHub Actions ([ci.yml](.github/workflows/ci.yml): formatação, lint, tipos, testes e build), automação de PR com Git Flow ([pr-automacao.yml](.github/workflows/pr-automacao.yml), a mesma do back), [CODEOWNERS](.github/CODEOWNERS) para `.github/` e [CONTRIBUTING.md](CONTRIBUTING.md).

- [x] 22/10/2026 · Filtros Período e Empresa ligados à API: opções de `/api/sessao` e valor escolhido em `?mes=` e `?empresa=` na Visão geral, com nova consulta a cada troca (os números anteriores ficam esmaecidos até os novos chegarem). Empresa só aparece com mais de uma no vínculo. Ver [filtros.ts](src/screens/visao-geral/filtros.ts), [useVisaoGeral.ts](src/api/useVisaoGeral.ts) e [httpClient.ts](src/api/httpClient.ts).

- [x] 21/10/2026 · Meses dos gráficos com o ano ("out-26", "mai-25"): a API manda o rótulo pronto (`rotulo_eixo` em `contra_referencia.py` do back), e as fixtures seguem o mesmo formato. Mais espaço entre os rótulos no gráfico do cartão de inadimplência. Ver [CartaoInadimplencia.tsx](src/components/CartaoInadimplencia.tsx).

- [x] 21/10/2026 · Seções Resultado e Financeiro da Visão geral montadas no back (`overnex-backend`, `resultado.py` e `financeiro.py`), no mesmo contrato: o front já as desenha sem mudança.

- [x] 21/10/2026 · Troca da Nilo Maia pela PJ Cortes no back: nada da Nilo Maia estava fixo no front. `dadosAte` e `atualizadoEm` aceitam `null` (antes da primeira carga), sem data inventada no cabeçalho e no rodapé; o mock `vazio` responde assim. Token fake padrão passa a ser o do usuário de desenvolvimento (`…0000000001a1`). Ver [visaoGeral.ts](src/contracts/visaoGeral.ts), [VisaoGeralTela.tsx](src/screens/visao-geral/VisaoGeralTela.tsx), [Assinatura.tsx](src/components/Assinatura.tsx) e [AuthProviderFake.tsx](src/auth/AuthProviderFake.tsx).

- [x] 19/10/2026 · Grade de velocímetros com tantas colunas quantos indicadores (até 4), e velocímetro limitado a 400px de largura quando o cartão alarga. Ver [SecaoVisaoGeral.tsx](src/screens/visao-geral/SecaoVisaoGeral.tsx) e [IndicadorGauge.css](src/components/IndicadorGauge.css).

- [x] 19/10/2026 · Cliente HTTP da API ([httpClient.ts](src/api/httpClient.ts)), com token do `useAuth`, escolhido por `VITE_API_MODO` em [Providers.tsx](src/app/Providers.tsx); proxy `/api` → `127.0.0.1:8000` no [vite.config.ts](vite.config.ts).
- [x] 19/10/2026 · Token do `AuthProviderFake` no formato `fake:<object_id>` aceito pela API local com `AUTH_FAKE=1` (padrão: Ana do seed). Ver [AuthProviderFake.tsx](src/auth/AuthProviderFake.tsx).

- [x] 16/10/2026 · Esqueleto do front: React + TypeScript + Vite, rotas, TanStack Query, Vitest, ESLint e Prettier.
- [x] 16/10/2026 · Painel Visão geral com a fixture (Vendas, Custos, Resultado e Financeiro), tema claro, escuro e automático, layout responsivo.
- [x] 16/10/2026 · Marca oficial extraída do mockup, CSP restritiva e bloqueio de `innerHTML` no lint.
- [x] 16/10/2026 · Projeto movido para a raiz do repositório; mockup retirado (não é guardado no repositório).
