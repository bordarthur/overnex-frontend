# TODO · Overnex frontend

Lista viva do projeto. Atualizada ao fim de cada tarefa: o que foi feito vai para **Concluído** (com data), o que surgiu entra em **A fazer** ou **A decidir**.

Última atualização: 11/11/2026

## Em andamento

- [ ] **Vendas, "Como o mês está andando": testar com a API.** O back passou a mandar `partes` no "Melhor e pior dia" (03/11/2026, ainda sem commit no back), na ordem Dias úteis, Ritmo atual, Necessário para a meta, Melhor e pior dia, Para a supermeta e "No mesmo dia de <mês anterior>"; com o mês fechado, o último vem como "Vendido em <mês anterior>". O `partes` do `api/openapi.json` bate com [painel.ts](src/contracts/painel.ts). "Para a supermeta" ainda não vem: o back não tem fonte. Falta abrir com `VITE_API_MODO=api` e conferir as partes e o último item num mês aberto e num mês fechado. Não foi testado em 03/11/2026 porque a API local estava ligada ao banco de produção com `AUTH_FAKE=1` (ver "Financeiro da Visão geral", abaixo).

- [ ] **Financeiro da Visão geral no mockup M2.1.4: testar com a API.** O back passou a mandar o contrato M2.1.4 (03/11/2026, ainda sem commit no back), e o `api/openapi.json` bate campo a campo com [visaoGeral.ts](src/contracts/visaoGeral.ts). Para a PJ, sem fonte de saldo: sem o KPI "Saldo em conta hoje" e sem a cobertura; "Próximos 7, 15 e 30 dias" sem saldo e sem caixa mínimo, com os textos "entra mais do que sai" / "sai mais do que entra"; "Contas a pagar lançadas" com um grupo só ("Todas as contas a pagar"); só o "A vencer" com `soNaBarra`. O front desenha esse formato (teste com [financeiroSemSaldo.ts](src/test/fixtures/financeiroSemSaldo.ts), conferido no navegador com o mock a 1440 e 390 px); com um grupo só, o nome e o número do grupo saem, porque repetem o topo do cartão.

  Falta:
  - abrir com `VITE_API_MODO=api` e conferir. Não foi testado em 03/11/2026: a API local estava ligada ao banco de produção (`aws-1-sa-east-1.pooler.supabase.com`) com `AUTH_FAKE=1`, o que o README do back proíbe, e o login real precisa da senha do usuário;
  - o back marcar também o "Em compensação" com `soNaBarra` (pedido em 02/11/2026; ainda não feito);
  - saldo em conta, caixa mínimo e cobertura dependem de uma fonte de saldo bancário que o back ainda não tem;
  - "Contas a pagar lançadas" por grupo (Fornecedores, "Custos fixos, despesas e impostos", Dívida e Capex, como no mockup): o front já desenha (é o que a fixture mostra). O back fez a regra em 03/11/2026 (`cfg.conta_dre.grupo_pagamento`, migration 20 e `supabase/producao/pj_cortes_grupos_pagamento.sql`, ainda sem commit), mas ainda não rodou em produção: até lá, a API manda um grupo só. Falta validar a regra conta a conta com os dados (prompt entregue em 04/11/2026; ver "A decidir").

- [ ] **Painel Pessoas: testar com a API.** O back publicou `GET /api/telas/pessoas` (PES-01, confirmado) em 30/10/2026, no contrato de [painel.ts](src/contracts/painel.ts). A fixture ([pessoas.json](src/api/fixtures/pessoas.json)) segue os textos da API, e os testes cobrem a resposta enxuta (1 a 4 fatos em "O que mudou", 3 KPIs sem faturado, cartões a menos, um setor só na produtividade, "vs 6m" sem valor, segundo trecho do aviso quando o mês não tem folha). Falta abrir com `VITE_API_MODO=api` e conferir troca de mês e empresa, a chave de setor encolhida, o estado vazio e o 403 de quem não tem PES-01. Não foi testado em 30/10 pelo mesmo motivo dos painéis financeiros (abaixo): a API local lê o banco de produção, e o token fake não pode ser usado assim.

- [ ] **Visão geral no mockup M2.1.2: testar com a API.** O back publicou em 28/10/2026 o contrato novo, que bate com [visaoGeral.ts](src/contracts/visaoGeral.ts), conferido campo a campo contra o `api/openapi.json` do back (os tipos do front continuam escritos à mão; não há gerador). O front já trata o que o back avisou:
  - Financeiro com 4 KPIs ("A receber vencido" entrou na fixture);
  - "Próximos 7, 15 e 30 dias" com um modo só ("lancado"), sem a chave de modos, quando o cliente não tem pagamento nos meses fechados;
  - PUT da escolha com a `empresa` da tela, o texto da API no 403, 404 e 422, e o seletor travado para o papel "leitor" ([SeletorDaSecao.tsx](src/screens/visao-geral/SeletorDaSecao.tsx)).

  Falta abrir com `VITE_API_MODO=api` e conferir: trocar as linhas de custo, recarregar e ver a escolha mantida, o 403 com um usuário leitor e o Financeiro sem os velocímetros de prazo. Não foi testado em 28/10 pelo mesmo motivo dos painéis financeiros (abaixo): o `api/.env` do back aponta para o banco de produção com `AUTH_FAKE=1`.

- [ ] **Painéis financeiros (Resultado, Receber e pagar): testar com a API.** O back publicou `GET /api/telas/resultado` (FIN-02) e `/api/telas/receber-pagar` (FIN-03) em 28/10/2026, e o contrato bate com [painel.ts](src/contracts/painel.ts) (conferido campo a campo contra o `api/openapi.json` do back). As fixtures foram ajustadas ao que a API manda. Falta abrir as duas telas com `VITE_API_MODO=api` e conferir: filtros Visão, Orçamento, Vendedor e Atraso, "Comparar com" (`?comparar=mes-anterior`), troca de mês e empresa, o `aviso` sem orçado, o estado vazio e o 403 do FIN-03 para perfil sem dado nominal. Não foi testado em 28/10 porque o `api/.env` do back aponta para o banco de produção com `AUTH_FAKE=1`, e o README do back proíbe usar o token fake assim: testar com o login real (`VITE_AUTH_MODO=api`) ou com a API apontada para um banco local.

- [ ] **Ciclo de caixa e Tabela financeira: testar com a API.** O back fez em 30/10/2026, na branch `feat/ajustes-financeiros` (ainda não está na `dev`): a Tabela financeira sai sempre, com `variante: "tendencia"`, sem as linhas "Ciclo de caixa" e "Dívida líquida / EBITDA" (sem fonte); o Receber e pagar continua com o cartão "prazos" na API real, porque falta o estoque a custo para o prazo médio de estoque, e o `ciclo-caixa` só vem no demo (`VISAO_GERAL_DEMO=1`). O front desenha os dois (teste em [PainelTela.test.tsx](src/screens/paineis/PainelTela.test.tsx)). Falta conferir com `VITE_API_MODO=api`, como os outros painéis financeiros. O ciclo de caixa na API real depende da fonte do estoque a custo.

- [ ] **Rótulos de mês com o ano: o back mandar.** Pedido em 30/10/2026: quando a série ou as colunas cruzam anos, o rótulo vem "mmm-aa" ("out-25"); num ano só, continua "out". As fixtures já seguem a regra (Resultado, Receber e pagar, Clientes e Pessoas; a Vendas já mandava assim). Os minigráficos de "Cada setor, mês a mês" (Pessoas) continuam com a inicial do mês ("O", "N"), com o ano na dica.

- [ ] **DRE gerencial: o back mandar valores cheios e a unidade da tendência.** Pedido em 30/10/2026: valores em reais (não em milhar), `rotuloConta` "Conta (R$)" e `tendencia.unidade` em cada linha: `pct` (% da receita bruta) para Deduções, Custos e Despesas variáveis, com as contas de dentro, e para o subtotal EBITDA; `brl` para as outras. O front já mostra "$" ou "%" ao lado da faísca e não mostra mais o código da conta. Ver [DreCartao.tsx](src/screens/paineis/DreCartao.tsx).

- [ ] **"Custos" no "Resultado mês a mês": o back mandar.** Pedido em 30/10/2026: um combo "Custos" (grupo 120) logo depois de "Receita bruta", antes de "Margem de contribuição"; barra vermelha quando o custo passa do orçado; linha de cima em % da receita bruta. A fixture já tem os 6 gráficos ([resultado.json](src/api/fixtures/resultado.json)).

- [ ] **Painéis comerciais (Vendas, Equipe comercial, Clientes): ligar à API.** O front está pronto com as fixtures do mockup Total M2.0.1 ([painel.ts](src/contracts/painel.ts), [PainelTela.tsx](src/screens/paineis/PainelTela.tsx), fixtures em [src/api/fixtures/](src/api/fixtures/)). Falta o back criar `GET /api/telas/vendas`, `/api/telas/equipe-comercial` e `/api/telas/clientes` nesse contrato (prompt entregue em 26/10/2026) e testar com `VITE_API_MODO=api`: filtros Canal, Linha e Supervisor indo na consulta, troca de mês e empresa, estados vazio e sem permissão. O back também precisa mandar `explicacao` nos cartões (prompt entregue em 26/10/2026); sem ela, o botão "i" não aparece.

- [ ] **Login com e-mail e senha: ligar à API.** O front está pronto e funciona com o login fake ([AuthProvider.tsx](src/auth/AuthProvider.tsx), [authClient.ts](src/auth/authClient.ts), telas em [screens/login/](src/screens/login/)). Falta o back criar `/api/auth/*` no contrato de [auth.ts](src/contracts/auth.ts) (Supabase Auth com refresh em cookie httpOnly; prompt entregue em 23/10/2026) e testar com `VITE_AUTH_MODO=api`: entrar, recarregar e continuar logado, renovação depois de vencer o token, sair, convite e recuperação de senha pelo e-mail. Com o mockup Login M2.0.0, o back também precisa:
  - mandar 429 com `Retry-After` quando houver tentativas demais;
  - mandar 410 para link vencido ou já usado;
  - usar os textos do mockup ("E-mail ou senha não conferem. Confira os dois e tente de novo.", "Foram 5 tentativas com a senha errada.");
  - configurar a política de senha igual a [senha.ts](src/auth/senha.ts) (8 caracteres, maiúscula e número).
- [ ] **Conferir as telas de acesso no navegador** (claro, escuro, celular em 360 px, movimento reduzido) contra o mockup Login M2.0.0. Os testes cobrem o comportamento, mas ninguém viu as telas ainda.

- [ ] **Medir o ganho dos pedidos adiantados no navegador.** Aba Network com a API local: tempo do login até a primeira tela e da troca de mês, antes e depois. Não foi medido em 23/10/2026 porque a API local respondia 500 em `/api/sessao` e na Visão geral. Para o "antes", rodar o commit anterior a esta mudança. Ver [adiantar.ts](src/api/adiantar.ts).

## A fazer

- [ ] **Gestão e escolha de empresa: testar com a API.** O front está pronto com o mock (ver Concluído em 11/11/2026); o back tem o código e o `api/openapi.json` (conferido em 10/11/2026: bate com [gestao.ts](src/contracts/gestao.ts) e [sessao.ts](src/contracts/sessao.ts)), mas as migrations 25 a 28 ainda não estão em produção. Depois delas, abrir com `VITE_API_MODO=api` e conferir, com a Dora (`fake:…0000000000ad`) e o Caio (`fake:…0000000000c0`): a entrada de cada um; o 403 do slug que a pessoa não pode abrir; `?cliente=` em toda chamada; o menu por `telas`; cada aba da Gestão com dado real (fontes, cargas, camadas); as gravações (204 e a tela pedida de novo) e os textos de 422; o DELETE do feriado; e o `inatividadeSegundos` do login.
- [ ] **Gestão: partes do mockup M2.1.0 que não entraram** (não montar sem o back): convite pela tela (botões "Convidar" e "Reenviar convite", gaveta de convite e o passo "Convite enviado"), painéis Carteira de clientes, Estoque e Compras e a camada "Estoque e compras", horas de implantação e checklist, barra de "% concluído", coluna "Colunas obrigatórias", as outras preferências (comparação padrão, período padrão, calendário, histórico) e segmento, ERP e base no cabeçalho da empresa.

- [ ] **Fluxo de caixa: o back criar a rota.** O front está pronto com a fixture ([fluxo-caixa.json](src/api/fixtures/fluxo-caixa.json)), e o prompt foi entregue em 06/11/2026: `GET /api/telas/fluxo-caixa` no contrato de [painel.ts](src/contracts/painel.ts), com o cartão novo `arvore-mensal`, o filtro `visao` (mês ou acumulado do ano), a linha "Sem classificação", `null` nos meses sem caixa e FIN-04 em `telas` de `/api/sessao`. Depois, testar com `VITE_API_MODO=api`: o acumulado, com a coluna do total e o saldo que abre em janeiro, o saldo negativo da PJ na cascata, troca de mês, estado vazio e 403. Ver [ArvoreMensal.tsx](src/screens/paineis/ArvoreMensal.tsx).
- [ ] **Projeção de caixa: testar com a API.** O back fez em 10/11/2026 (sem commit e não publicado; sem migration nova): na `GET /api/telas/fluxo-caixa`, o filtro `projecao` e os seis cartões, e as rotas `PUT /api/telas/{tela}/cartoes/{cartao}/periodo` e `.../grupos/{grupo}` (só `fluxo-caixa` com `provisoes` aceita; o resto dá 404). Conferido em 10/11/2026, sem rodar a API: o `api/openapi.json` do back bate com [painel.ts](src/contracts/painel.ts) (cartões, corpos, rotas e `?empresa=`), o demo do back é igual à [fluxo-caixa.json](src/api/fixtures/fluxo-caixa.json), e os textos de erro são os do mock. Falta abrir com `VITE_API_MODO=api` e conferir: a troca da chave; a gravação do período, da chave e do valor (204 e a tela pedida de novo); o 403 "Você não pode mudar as provisões deste painel." (perfil sem a FIN-04) e o 403 genérico; o 422 "O valor precisa ser zero ou mais."; o quadro "Próximos 30 dias" crítico e saudável; o detalhe "não recorrente" com os investimentos ligados (o mock continua mostrando "não recorrente: desligado"); o subtítulo e o texto do "De onde vem" sem inadimplência e com efeito líquido positivo; cliente sem saldo inicial (parte de zero, com nota); saldo negativo da PJ; cliente sem títulos; e o caixa mínimo ausente. Ver [Provisoes.tsx](src/screens/paineis/Provisoes.tsx) e [OrigemProjecao.tsx](src/screens/paineis/OrigemProjecao.tsx).
- [ ] **Cores do mockup: testar com a API.** O back fez em 10/11/2026 (sem commit e não publicado): `serie-azul` nos financiamentos da geração de caixa (e `quadrado-azul` na legenda), `serie-azul` e `serie-laranja` nas admissões e desligamentos de Pessoas (com as legendas), `cor` em cada gráfico de "Cada setor, mês a mês", `cor` (`entra` e `sai`) nas janelas do Receber e pagar e `tomEtiqueta: "vermelho"` em "parou de comprar". Conferido em 10/11/2026, sem rodar a API: os demos do back (`pessoas.json` e `receber-pagar.json`) são iguais às fixtures do front. Falta abrir com `VITE_API_MODO=api` e olhar as cores com dado real (mais de sete setores em Pessoas, por exemplo).
- [ ] **"Mostrar nomes" em "Cargos e salários": o back fazer.** O front está pronto com o mock (prompt entregue em 04/11/2026): a API manda `nomes: { rotulo }` no cartão só para quem pode ver dado nominal (perfil de RH), e a rota nova `GET /api/telas/{tela}/cartoes/{id}/nomes`, com os mesmos filtros do painel, devolve a tabela de uma linha por pessoa (`TabelaNomes`), com 403 para quem não pode. Depois, testar com `VITE_API_MODO=api` com um usuário de RH e um sem o perfil. Ver [TabelaCartao.tsx](src/screens/paineis/TabelaCartao.tsx), [useNomes.ts](src/api/useNomes.ts) e [painel.ts](src/contracts/painel.ts).
- [ ] **Idade dos títulos no Receber e pagar: testar com a API.** O back passou a mandar `soNaBarra` (true só no "A vencer", nos dois lados) e `rotuloParticipacao` ("da carteira" no a receber, "do total" no a pagar) em 04/11/2026, ainda sem commit no back; o `api/openapi.json` bate com [painel.ts](src/contracts/painel.ts) (`CartaoDoisLados`, os dois campos aceitam `null`), e o demo do back é igual à fixture do front. Falta abrir com `VITE_API_MODO=api` e conferir. Não foi testado em 04/11/2026 pelo mesmo motivo dos outros painéis financeiros: a API local lê o banco de produção. Ver [BarraIdade.tsx](src/components/BarraIdade.tsx).
- [ ] **Sessão por inatividade: o back garantir.** O front derruba a sessão depois do tempo de sessão parada da pessoa (`inatividadeSegundos`; ver Concluído em 11/11/2026), mas só com a aba aberta: com a aba fechada ou o navegador encerrado, o cookie de refresh continua valendo e, ao abrir o site de novo, a sessão volta sem senha. Falta o back recusar o `/api/auth/renovar` depois desse tempo sem uso (prompt entregue em 04/11/2026). Depende de o login estar ligado à API (em "Em andamento"). Ver [useInatividade.ts](src/auth/useInatividade.ts).
- [ ] **Sair numa aba derrubar as outras.** A inatividade já é dividida entre as abas (canal `overnex-sessao`), mas o Sair do menu não avisa as outras: elas só percebem no próximo pedido à API. Ver [useInatividade.ts](src/auth/useInatividade.ts) e [AuthProvider.tsx](src/auth/AuthProvider.tsx).
- [ ] **Painéis comerciais, partes do mockup que ficaram de fora:** "Mix por cliente" (cartão V2 de Vendas), "Mostrar fontes de dados" e a carteira cliente a cliente ("Carteira de clientes", módulo Distribuidora). Ver [CartaoPainel.tsx](src/screens/paineis/CartaoPainel.tsx).
- [ ] **Pedidos adiantados dos painéis comerciais.** Hoje só a Visão geral é adiantada; avaliar adiantar Vendas depois da primeira tela. Ver [adiantar.ts](src/api/adiantar.ts) e [usePainel.ts](src/api/usePainel.ts).

- [ ] **Configurar o GitHub para colaboradores** (front e back), como em [CONTRIBUTING.md](CONTRIBUTING.md): branch `dev`, GitHub App com `APP_ID` e `APP_PRIVATE_KEY`, rulesets em `main` e `dev` (PR com 1 aprovação, CODEOWNERS, checks obrigatórios `verificar` no front e `api` e `carga` no back, App e Admin no bypass) e colaboradores com papel Write. Sem isso, o CI roda mas a automação de PR falha no primeiro passo.

- [ ] **Filtro "Comparar com" de verdade.** Período e Empresa já vêm de `/api/sessao` e vão na consulta; "Comparar com" ainda só troca o rótulo (a API não tem esse parâmetro). Ver [filtrosDemo.ts](src/screens/visao-geral/filtrosDemo.ts).
- [ ] **"Ver painel" para o Caixa.** O link só aparece quando a tela de `telaDestino` existe no front; "Dívida líquida / EBITDA" aponta para `caixa`, que ainda não existe ("Folha sobre a receita" já leva a Pessoas). Ver [SecaoVisaoGeral.tsx](src/screens/visao-geral/SecaoVisaoGeral.tsx).
- [ ] **Logo do cliente no co-branding.** A CSP só aceita `img-src 'self'`, então a API precisa servir o logo. Ver [Cabecalho.tsx](src/components/Cabecalho.tsx).

### Integração com o banco (análise do overnex-backend em 16/10/2026)

O que o back precisa criar está na seção "Para o front consumir (Visão geral)" do `TODO.md` do `overnex-backend`. Do lado do front:

- [ ] **Testar o cliente HTTP contra a API local** com `VITE_API_MODO=api`, quando a API subir nesta máquina (depende do item abaixo).
- [ ] **Gerar os tipos do contrato a partir do OpenAPI do back**, quando o contrato da Visão geral existir lá, e apagar `src/contracts/visaoGeral.ts` escrito à mão.
- [ ] **Logo do cliente vindo da sessão.** O cabeçalho ainda usa o `cliente` do payload da tela; a sessão já traz `logoUrl`. Ver "Logo do cliente no co-branding", acima.
- [ ] **`?mes=` no back.** O front já manda `mes` (AAAA-MM) e `empresa` na Visão geral, mas a API ainda ignora `mes` e lista só o mês do snapshot em `/api/sessao`: escolher outro mês devolve os mesmos números. Pedido ao back em 22/10/2026.
- [ ] **Telas que lerem `GET /api/dados/{tabela}`:** nenhuma lê hoje. Quando alguma ler, pegar nomes de tabela e coluna da PJ Cortes (`f_vendas_pj`, `d_cliente_pj`…), não os da Nilo Maia, que foram apagados do banco.
- [ ] **Conferir Resultado e Financeiro com a API** depois da primeira carga da PJ Cortes. As duas seções vêm do back, com regras provisórias, e o Resultado mostra menos que a fixture: sem "EBITDA projetado" e "Dívida líquida / EBITDA" (o back não tem fonte). O Financeiro passa a ter só cartões (ver "Visão geral no mockup M2.1.2" acima). Ver o `TODO.md` do `overnex-backend`.
- [ ] **Ambiente local da API.** Esta máquina não tem Docker nem Supabase CLI, e o `api/.env` do back não existe.

## A decidir

- [ ] **Gestão: o que não encaixa nas regras ou mudou em relação ao mockup M2.1.0** (decidir com o usuário). Ver [src/screens/gestao/](src/screens/gestao/):
  - a faixa "Configuração, não personalização" traz "Universal Básico" e "Universal Completo" em texto fixo (como no mockup), e os nomes dos grupos vêm do contrato: se o back renomear um grupo, a faixa fica velha. A nota embaixo da aba Implantação ficou de fora (repetia a faixa e falava das horas, que não entram);
  - "Mais de 12 h, só Admin BORD" está em texto fixo em dois lugares (como no mockup); as opções em si vêm de `sessoes`;
  - a aba "Horas e cargas" ficou "Cargas" (sem as horas, o nome enganava) e "Preferências do cliente" ficou "Preferências da empresa" (vocabulário da tela);
  - cor da camada: o azul e o roxo do mockup vão pela ordem em que os grupos aparecem (primeiro grupo azul, segundo roxo), sem nome de grupo fixo. O roxo é token novo (`--dir`, em [tokens.css](src/theme/tokens.css));
  - "Ao entrar" em vermelho quando o `tipo` é `nada`: a API manda o tipo, não um status; a cor segue o mockup;
  - o botão principal da gaveta é verde, como o `.btn` do resto do app (no mockup é grafite);
  - a troca de empresa é pelo menu (rail), e não "pelo topo do app" como diz o mockup; o texto da prévia diz "pelo menu";
  - a prévia do menu mostra só o nome dos painéis: o contrato não traz a contagem de gráficos do mockup;
  - o cartão do perfil conta só as pessoas ativas (`pessoas`), e o filtro da coluna lateral conta todas (`total`): para o Cliente usuário do mock aparecem 5 e 6. São os números da API; unificar seria no back.
- [ ] **Pedido adiantado ao entrar por "/".** Com o slug obrigatório, a Visão geral não sai mais junto com a `/api/sessao` em "/": espera a sessão dizer a empresa (uma ida a mais à API, só no login direto; o back já prepara as telas quando recebe a sessão). Dá para voltar a pedir junto, sem slug, só para quem tem uma empresa, mas o Admin BORD e quem tem mais de uma receberiam um 403 a cada login, e a API registra toda negação. Ver [adiantar.ts](src/api/adiantar.ts).

- [ ] **Sinal de menos nos textos que o back monta.** O front escreve os valores negativos com o menos tipográfico ("−R$ 1,95 mi", em [numero.ts](src/format/numero.ts)), e o back, nos textos prontos, com o hífen ("-R$ 1,95 mi", `moeda_sinal` e `numero` em `visao_geral/texto.py`); só o `vendas.py` já usa o "−". Com a API, os dois aparecem na mesma tela (no "De onde vem a projeção" e na Visão geral). Decidir se o back troca para "−" em tudo (muda textos da Visão geral e os testes de lá); o prompt foi entregue em 10/11/2026.
- [ ] **Caixa mínimo do Fluxo de caixa.** O usuário não sabe de onde vem (09/11/2026). Sem ele, a linha laranja do saldo projetado não sai, e o farol do "Menor saldo" só fica crítico abaixo de zero. Proposta: um parâmetro por cliente cadastrado pela LANN (`financeiro.caixa_minimo`, já previsto no back), por exemplo cerca de 15 dias de saídas médias.
- [ ] **Partes antigas em grafite sem a cor do mockup registrada.** Com a decisão de 09/11/2026 (cores do mockup também fora de status), foram trocadas as que o TODO registrava. Sem o mockup no repositório, não dá para conferir as outras, como a "Cobertura de caixa" e as barras da Visão geral (decisão de 28/10/2026). Trazer os mockups para conferir.

- [ ] **Fluxo de caixa, partes do mockup Total M2.1.1 ("Caixa") que ficaram de fora ou mudaram** (decidir com o usuário). A tela só tem o realizado, porque o back não tem saldo bancário nem projeção (decisão de 06/11/2026). Ver [fluxo-caixa.json](src/api/fixtures/fluxo-caixa.json):
  - a projeção foi feita em 09/11/2026 (ver Concluído). Ficaram de fora: o V2 "O que fazer para não furar" e o banner das contas a pagar incompletas como faixa própria (virou a `chamada` do saldo projetado). Mudou: "De onde vem a projeção" tem uma linha por grupo de provisão (no mockup, "Folha", "Impostos estimados pelo faturamento" e "Recorrentes"), os impostos saem pela média paga, e não pelo faturamento; "De onde vem" fica ao lado da semana a semana, e "Para onde vai" divide a linha com o pago contra lançado (no mockup, sozinho); a coluna "Média paga por mês" virou "Média por mês", porque os recebimentos também estão nela; "Para onde vai" usa os nomes dos grupos de provisão ("Empréstimos e juros" no lugar de "Financeiro") e fica sem o rodapé da dívida líquida (sem fonte de dívida);
  - "Movimentações do período" (lançamento a lançamento, com busca): o back não citou; precisaria de um cartão novo e de outra consulta;
  - nome da tela: no mockup é "Caixa"; aqui ficou "Fluxo de caixa". Código FIN-04 a confirmar com o back;
  - cascata "Do saldo inicial ao saldo final" e os destaques do topo não estão no mockup (a cascata foi sugestão do back), e a cascata ficou sem "i" (o mockup não traz texto para ela);
  - o chip "Comparar com" saiu desta tela: o caixa não tem orçado, e os destaques já comparam com o mês anterior.
- [ ] **Cascata: rótulo de valor pequeno em reais cheios.** No "Do saldo inicial ao saldo final", o "Sem classificação" sai "−R$ 6.000", ao lado de "−48 mil" e "−120 mil". É o formato do eixo ([escala.ts](src/charts/escala.ts)) para valores abaixo da escala do gráfico; mudar vale para todas as cascatas.

- [ ] **Grupos de pagamento da PJ Cortes** ("Contas a pagar lançadas"): o back já tem uma regra, combinada em 03/11/2026, pelo `Id_Descritivo` de cada conta: Fornecedores = 120.01, 120.04 e verbas de fornecedor (2500xx em 180); Capex = classe FCI; Dívida = 400 e 170.01.05; fora dos grupos = retirada de sócios (210), receitas lançadas no a pagar (100, 160 e 190) e conta fora do caixa (900); o resto vai para Custos fixos, despesas e impostos. Falta a LANN validar com os dados, conta a conta: valores por grupo nos 6 meses, contas duvidosas e contas do a pagar sem de-para (prompt de validação entregue ao back em 04/11/2026). Ver `supabase/producao/pj_cortes_grupos_pagamento.sql` no back.

- [ ] **Painel Pessoas, partes do mockup M2.1.1 que ficaram de fora ou mudaram** (decidir com o usuário). Ver [pessoas.json](src/api/fixtures/pessoas.json):
  - cartão V2 "Módulo de analista de RH" (a chave "Mostrar nomes" de "Cargos e salários" foi feita em 04/11/2026, abaixo);
  - chip "Setor" no topo: ficou só a chave dentro de "Admissões, desligamentos e turnover" (decisão de 30/10/2026);
  - no celular, "Indicador" some da produtividade (o título do gráfico ao lado diz qual é);

- [ ] **Painéis financeiros, partes do mockup que não encaixam nas regras ou no back** (decidir com o usuário). Onde havia recomendação, o front já a seguiu; falta confirmar:
  - cartões marcados "A decidir" no mockup (Ponte do EBITDA, Maiores desvios e Nível 3 da DRE): estão nas fixtures; o back só os manda depois da aprovação. A Tabela financeira foi aprovada em 30/10/2026;
  - sem fonte no back: saldo em conta, "Saldo em 30 dias" e "Saldo no fim" das janelas. O front mostra se vierem;
  - PDD ("regra a definir") e limite de crédito (`en_limitecredito` existe na PJ?);
  - "Quem cobrar hoje" ficou sem a caixa de marcar (sem gravar no back, a marcação sumiria ao recarregar);
  - selo "Universal Completo" no menu e no cabeçalho: ficou de fora;
  - "Comparar com" vai na consulta do Resultado só com "Mês anterior"; "Meta comercial" e "Mesmo mês de 2025" continuam só no rótulo. Ver [filtrosPainel.ts](src/screens/paineis/filtrosPainel.ts);
- [ ] **Explicação ("i") dos cartões que o mockup não explica:** Linhas de produto, Vendas nos últimos 12 meses, Participação das linhas, Movimento por dia da semana, Itens que mais vendem, Itens por atendimento e todos os cartões de Pessoas. Escrever os textos ou deixar sem "i"? Na Visão geral, os cartões do Financeiro já aceitam `explicacao`; a inadimplência fica sem, porque o mockup não traz texto para ela. Ver [Explicacao.tsx](src/components/Explicacao.tsx).

- [ ] **Partes do mockup Login M2.0.0 que ficaram de fora** (decidir com o usuário). Ver [LoginTela.tsx](src/screens/login/LoginTela.tsx) e [LayoutAcesso.tsx](src/screens/login/LayoutAcesso.tsx):
  - entrar com Microsoft e Google;
  - código de verificação por e-mail (2FA);
  - "Manter conectado neste aparelho";
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
- [ ] **Partes do mockup Visão geral M2.1.2 que ficaram de fora ou mudaram** (decidir com o usuário):
  - "Placar das áreas" (marcado V2), seções Compras e Estoque (Módulo Distribuidora, fora do escopo universal) e o botão "Etiquetas internas" com os selos "Universal Completo", "fonte a definir" e "nome a validar";
  - (M2.1.4) "Saldo em conta hoje", o caixa mínimo e a "Cobertura de caixa" voltaram à fixture, mas o back não tem fonte de saldo bancário: de onde vem o saldo e quem cadastra o caixa mínimo (R$ 500 mil no mockup)? Sem saldo, o "Próximos 7, 15 e 30 dias" começa em zero e mostra quanto sobra ou falta na janela;
  - status das janelas sem saldo: sobra = saudável e falta = atenção? Com saldo, o mockup usa crítico abaixo de zero e atenção abaixo do caixa mínimo;
  - (M2.1.4) a nota do topo fala em "aceleradores" (os velocímetros), como no mockup: manter o termo?
  - "Inadimplência corrente": o mockup marca o nome como "nome a validar";
- [ ] **Aviso "este filtro só muda o rótulo".** O mockup mostra um aviso ao trocar filtro; ficou de fora. Incluir enquanto os filtros não funcionam?
- [ ] **Botão "Mostrar fontes de dados".** Ficou de fora desta entrega. Entra em qual?

## Concluído

- [x] 11/11/2026 · **Gestão (Interno BORD) e escolha de empresa**, como no mockup Gestão M2.1.0, com o mock (o back ainda não publicou as migrations). Fecha "Menu pelas telas liberadas", "Visão de administrador da LANN" e "Slug da URL diferente do cliente da sessão".
  - **Empresa escolhida em toda chamada:** o slug da URL vai em `?cliente=` de `/api/sessao` e de toda rota de tela (GET e PUT) e entra em toda query key ([useClienteSlug.ts](src/api/useClienteSlug.ts), [httpClient.ts](src/api/httpClient.ts)); trocar de empresa monta a tela de novo, sem os filtros nem os números da anterior. Slug que a pessoa não pode abrir (403) e tela fora de `telas` mostram "sem acesso" ([Moldura.tsx](src/app/Moldura.tsx)).
  - **Ao entrar:** Admin BORD vai para a Gestão; uma empresa, direto para a primeira tela liberada; duas ou mais, a tela "Escolha a empresa" ([EscolhaEmpresa.tsx](src/screens/entrada/EscolhaEmpresa.tsx)); nenhuma, o `aviso` da API com o botão Sair ([Guardas.tsx](src/app/Guardas.tsx)).
  - **Menu:** só as telas de `telas` ([menu.ts](src/app/menu.ts), [telas.ts](src/contracts/telas.ts)), o seletor de empresa para quem abre mais de uma e o atalho "Gestão" para o Admin BORD ([Rail.tsx](src/components/Rail.tsx)).
  - **Inatividade por pessoa:** `inatividadeSegundos` de entrar, renovar e definir senha, no lugar dos 30 min fixos ([AuthProvider.tsx](src/auth/AuthProvider.tsx)).
  - **Gestão** ([src/screens/gestao/](src/screens/gestao/), em arquivo separado do resto do app): empresas com as abas Implantação, Prontidão dos dados, Painéis, Preferências (com os feriados), Usuários e acesso (com a matriz) e Cargas; usuários com os filtros da API, a busca e a gaveta de edição. As gravações pedem a Gestão de novo e mostram o texto da API quando ela recusa. DELETE no cliente HTTP.
  - **Componentes novos:** [Abas.tsx](src/components/Abas.tsx), [Gaveta.tsx](src/components/Gaveta.tsx), [CampoBusca.tsx](src/components/CampoBusca.tsx), [Selecao.tsx](src/components/Selecao.tsx), [OpcaoCartao.tsx](src/components/OpcaoCartao.tsx) e a pílula neutra ([Pill.tsx](src/components/Pill.tsx)).
  - **Mock:** banco na memória com 5 empresas e 12 pessoas ([mockGestao.ts](src/api/mockGestao.ts), [gestao.json](src/api/fixtures/gestao.json)), com as regras e os textos de erro do back; o começo do e-mail do login fake escolhe a pessoa ([personasFake.ts](src/auth/personasFake.ts)).

  Conferido no navegador (Edge headless, mock com login fake): Gestão a 1440 px claro e escuro, 1100 e 390 px; ligar e desligar painel com a prévia do menu, linhas de custo, incluir e tirar feriado, filtro e busca de pessoas, a gaveta (recusa da API, Esc e a volta do foco); a entrada do Admin BORD, do consultor (escolha e troca de empresa pelo menu, a 1440, 1100 e 390 px), da conta sem empresa e de quem tem uma empresa só; tela e empresa negadas. Não foi testado com a API (ver "A fazer").

- [x] 10/11/2026 · **Rótulo do ponto marcado sempre acima da linha** no gráfico de linhas (pedido do usuário, com o saldo projetado da API: o rótulo do primeiro dia saía embaixo do ponto e cruzava a linha). No lugar da regra de 09/11/2026 (embaixo quando a linha sobe a partir do ponto), o rótulo fica acima do ponto e do trecho mais alto da linha por baixo do texto; dois rótulos que se encostariam ficam um em cima do outro, e o topo do desenho cresce até 45 px quando eles não cabem (no celular, com os dois pontos da visão com provisões). Ver [rotulosMarcas.ts](src/charts/rotulosMarcas.ts), [Linhas.tsx](src/charts/Linhas.tsx) e [Linhas.test.tsx](src/charts/Linhas.test.tsx). Conferido no navegador (Edge headless, mock com login fake): 1440 px e 390 px, nas duas visões. O gráfico de uma linha só da Visão geral ([Linha.tsx](src/charts/Linha.tsx)) não mudou: lá o rótulo continua 12 px acima do ponto.
- [x] 09/11/2026 · **Projeção de caixa** no Fluxo de caixa, como no mockup Total M2.1.1 ("Caixa"), com dado fictício coerente entre os cartões (saldo de partida R$ 1,42 mi, 58% e 2% da média paga lançados). Regras aprovadas com o usuário: partida no saldo da DFC; a receber no vencimento mais 2 dias úteis, sem os vencidos (V2); a pagar no vencimento, com os vencidos no primeiro dia; provisões por grupo pela DFC (média do período − lançado em cada janela de 30 dias, no perfil do dia do mês); pago e lançado pelos títulos; semanas de segunda a domingo; provisões gravadas para o cliente. Feito:
  - chave "Só lançados / Lançados + provisões" no cabeçalho do saldo projetado: um filtro da tela com `cartao` ([filtrosPainel.ts](src/screens/paineis/filtrosPainel.ts), [CaixaCartao.tsx](src/screens/paineis/CaixaCartao.tsx)), que vai na consulta e que "Limpar filtros" não apaga;
  - saldo projetado dia a dia (gráfico `alto`, caixa mínimo em laranja com `estilo: "minimo"` e o rótulo do ponto embaixo quando a linha sobe, em [Linhas.tsx](src/charts/Linhas.tsx)), com a `chamada` das contas a pagar incompletas;
  - cartões novos `origem-projecao` ([OrigemProjecao.tsx](src/screens/paineis/OrigemProjecao.tsx)), com o riscado, e `provisoes` ([Provisoes.tsx](src/screens/paineis/Provisoes.tsx)), com período, chave e campo em milhares que gravam na API (`PUT`), pedem a tela de novo e mostram a recusa da API; sem `editavel`, tudo parado;
  - "Pago contra lançado" com `quadros` e `rodape` no cartão de gráficos, "Semana a semana" com `variante: "listrada"`, a pílula do mês (`marca`), o traço na virada (`separar`) e o farol no menor saldo, e "Para onde vai o caixa em 30 dias";
  - mock: a chave troca os cartões por [fluxo-caixa-provisoes.json](src/api/fixtures/fluxo-caixa-provisoes.json), e as provisões gravadas ficam na memória.

  Conferido no navegador (Edge headless, mock com login fake): 1440 px claro nas duas visões, 1440 px escuro e 390 px. No celular, as provisões escondem média, lançado e sugerida para o campo caber.

- [x] 09/11/2026 · **Cores do mockup também fora de status** (decisão do usuário, no lugar da de 28/10/2026; regra nova no [CLAUDE.md](CLAUDE.md)): financiamentos azuis na geração de caixa, admissões azuis e desligamentos laranja em Pessoas, cada setor na cor dele em "Cada setor, mês a mês" (`cor` no gráfico, com o quadradinho no título), "Pagamento" azul no Ciclo de caixa, a receber azul e a pagar vermelho nas janelas do Receber e pagar (`cor` na linha), "parou de comprar" em vermelho (`tomEtiqueta`) e chave ligada em verde ([Chave.css](src/components/Chave.css)). Estilos novos: `serie-azul` e `serie-laranja` nas barras e `quadrado-azul` e `quadrado-laranja` na legenda. As cores dos comerciais (azul e laranja como série) ficam como no mockup.
- [x] 06/11/2026 · Tela **Fluxo de caixa** (DFC realizado), com dado fictício (números do realizado do "Caixa" no mockup Total M2.1.1), no grupo Financeiro do menu, depois de "Receber e pagar" (rota `fluxo-caixa`):
  - aviso, destaques (saldo final, geração operacional e variação do caixa) e apoios;
  - cascata do saldo inicial ao saldo final;
  - "Geração de caixa realizada" (FCO, FCF e FCI mês a mês);
  - "Fluxo de caixa realizado" no cartão novo `arvore-mensal` ([ArvoreMensal.tsx](src/screens/paineis/ArvoreMensal.tsx)): uma coluna por mês, a árvore da DRE (até o nível 4), mês sem movimento vazio, farol nas células, a coluna do acumulado separada e a coluna da conta presa ao rolar no celular;
  - sem o chip "Comparar com" (`semComparar` em [telas.ts](src/screens/paineis/telas.ts));
  - a árvore ficou genérica ([arvoreDre.ts](src/screens/paineis/arvoreDre.ts)), a legenda ganhou o `quadrado-medio` e a cascata ([Cascata.tsx](src/charts/Cascata.tsx)) passou a aceitar saldo negativo (linha do zero e rótulo embaixo da barra) e a alargar as barras quando dois rótulos vizinhos longos não cabem.

  Conferido no navegador (Edge headless, 1440 px claro e escuro, 1100 e 390 px) com o mock; as cascatas do Resultado continuam sem rolagem a 1440 e 1100 px.

- [x] 04/11/2026 · "Mostrar nomes" no "Cargos e salários" (Pessoas), decidido com o usuário: a chave só aparece quando a API manda `nomes` no cartão (quem não tem o perfil de RH não a vê); ligada, o front pede a tabela de uma linha por pessoa (pessoa e setor, cargo, salário e custo) com os mesmos filtros do painel e troca o subtítulo pelo que vier; desligada, volta ao agregado e os nomes saem do cache na hora (o cartão que sai da tela os guarda por um minuto). A recusa da API aparece no lugar da tabela. Chave nova em [Chave.tsx](src/components/Chave.tsx); a tela e os filtros chegam ao cartão por [consultaPainel.ts](src/screens/paineis/consultaPainel.ts). Pessoas fictícias na fixture ([pessoas-cargos-salarios-nomes.json](src/api/fixtures/pessoas-cargos-salarios-nomes.json)). Conferido no navegador (Edge headless, 1440 px claro e escuro, 390 px) com o mock.
- [x] 04/11/2026 · "Contas a receber e a pagar" sem o cabeçalho do cartão na tela (o título fica para o leitor de tela; cada lado já tem o seu), com as duas metades coloridas indo até o topo do cartão. Os KPIs dos lados continuam em três colunas iguais, com o texto quebrando quando não cabe (o KPI sem quebra de linha foi testado e desfeito no mesmo dia, a pedido: o terceiro descia para outra linha). Ver [DoisLados.css](src/screens/paineis/DoisLados.css) e [CaixaCartao.tsx](src/screens/paineis/CaixaCartao.tsx) (`semCabecalho`). Conferido no navegador (Edge headless, de 1920 a 390 px) com o mock.
- [x] 04/11/2026 · "Contas a receber e a pagar" nas cores do mockup: título do a receber em azul e do a pagar em vermelho, e cada metade com o fundo no tom do título, indo até a borda do cartão, com o traço entre as duas. A cor vai pela posição (primeiro lado = o que entra, segundo = o que sai), sem nome fixo. Tokens próprios com o mesmo tom do mockup (`--fluxo-entra-texto` e `--fluxo-sai-texto`, em [tokens.css](src/theme/tokens.css)), separados do `--ok` e do `--crit` do status. Com chamada ou nota no cartão, as metades param antes delas. Ver [DoisLados.css](src/screens/paineis/DoisLados.css). Conferido no navegador (Edge headless, 1440 px claro e escuro, 1280 e 390 px) com o mock.
- [x] 04/11/2026 · Idade dos títulos do Receber e pagar ("Contas a receber e a pagar") com a barra e as fitas até os quadros, como a inadimplência da Visão geral: o "A vencer" fica só na barra, com o texto dentro, e cada faixa vencida tem um quadro; faixa zerada fica fora da barra, com o quadro apagado e sem fita. A barra virou componente ([BarraIdade.tsx](src/components/BarraIdade.tsx)), usado pelos dois cartões. Contrato: `soNaBarra` em cada faixa e `rotuloParticipacao` no lado, os dois opcionais ([painel.ts](src/contracts/painel.ts)). Conferido no navegador (Edge headless, 1440 px claro e escuro, 1280 e 390 px) com o mock; a inadimplência da Visão geral continua igual.
- [x] 04/11/2026 · "Contas a pagar lançadas" nas cores do mockup, como no "Próximos dias": lançado em vermelho sólido com o texto em branco, falta listrada em vermelho com borda e o rótulo em vermelho, meses pagos no cinza do saldo. O rótulo da média, quando é mais largo que a coluna dos 30 dias, cresce para a esquerda e fica dentro do gráfico (passava da borda no Capex). As cores comuns aos dois cartões viraram variáveis (`--fx-cinza`, `--fx-hatch-entra` e `--fx-hatch-sai`), e o grafite antigo saiu. Ver [CartaoPagarLancado.css](src/components/CartaoPagarLancado.css) e [CartaoProximosDias.css](src/components/CartaoProximosDias.css). Conferido no navegador (Edge headless, 1440 px claro e escuro, 1280, 1100 e 390 px) com o mock.
- [x] 04/11/2026 · "Próximos 7, 15 e 30 dias" nas cores do mockup: a receber em azul e a pagar em vermelho, sólidos, com os números em branco; vendas novas e contas a lançar listradas no mesmo tom, com borda; saldo de hoje em cinza claro. Os tons são tokens próprios (`--fluxo-entra` e `--fluxo-sai`, em [tokens.css](src/theme/tokens.css)), separados do `--ok` e do `--crit` do status; "Contas a pagar lançadas" e "Cobertura" continuam em grafite. Ver [CartaoProximosDias.css](src/components/CartaoProximosDias.css). Conferido no navegador (Edge headless, 1440 px claro e escuro, 390 px) com o mock.
- [x] 04/11/2026 · Sessão encerrada depois de 30 min sem uso. Conta como uso clicar, tocar, digitar, rolar e mover o mouse (mouse parado no lugar não conta); pedidos em segundo plano não contam. Aviso "Você ainda está aí?" 2 min antes, com contagem, "Continuar conectado" (ou Esc) e "Sair agora"; mexer o mouse com o aviso aberto não o fecha. Ao cair, a API é avisada (`/sair`), o cache é apagado e o login mostra "Sua sessão terminou" com a mesma conta e a volta para a tela em que estava. As abas do mesmo navegador dividem a atividade e a queda (BroadcastChannel, sem storage), e quem volta de um computador que dormiu sai na hora. `VITE_INATIVIDADE_MIN` encurta o prazo para testar. Ver [useInatividade.ts](src/auth/useInatividade.ts), [AvisoInatividade.tsx](src/app/AvisoInatividade.tsx), [AuthProvider.tsx](src/auth/AuthProvider.tsx) e [LoginTela.tsx](src/screens/login/LoginTela.tsx). Conferido no navegador (Edge headless, 1440 px) com o login fake e o mock, com o prazo de 9 s.
- [x] 03/11/2026 · "Mapa de produtividade" (Equipe comercial) sem nomes encavalados: cada nome procura lugar livre em 8 direções ao redor da bolha, perto antes de longe, sem passar por outro nome, por uma bolha ou pelos nomes dos quadrantes; afastado, ganha um traço até a bolha, que também não atravessa outra bolha nem outro nome. Sem lugar, o nome fica só na dica (as maiores bolhas escolhem primeiro). Os nomes dos quadrantes saem quando os da esquerda e da direita não cabem lado a lado (no celular, eles se encavalavam). Ver [rotulosPontos.ts](src/charts/rotulosPontos.ts) e [Dispersao.tsx](src/charts/Dispersao.tsx). Conferido no navegador (Edge headless, 1440, 1100 e 390 px) com o mock, com 22 vendedores nas posições do print da API.

- [x] 03/11/2026 · Contrato do Financeiro M2.1.4 e de `partes` (Vendas) conferido contra o `api/openapi.json` do back: bate. "Contas a pagar lançadas" com um grupo só sem repetir o nome e o número do topo, com as barras mais largas de antes; no celular, a legenda do "Próximos dias" sem os itens que não valem no modo e o rótulo da média alinhado à direita. Conferido no navegador (Edge headless, 1440 e 390 px) com o mock no formato que a API manda para a PJ.

- [x] 03/11/2026 · Vendas, "Como o mês está andando": estatística com `partes` (campo opcional em `ItemValor`, [painel.ts](src/contracts/painel.ts)), para o "Melhor e pior dia" mostrar os dois valores inteiros, quebrando a linha entre eles quando não cabem ("R$ 341 mil ·" / "R$ 287 mil"). Valor em texto cortado ganha a dica com o texto completo. Conferido no navegador (Edge headless, 1440, 1100 e 390 px) com o mock.

- [x] 02/11/2026 · Financeiro da Visão geral no visual do mockup M2.1.4, com dado fictício (Vendas, Custos e Resultado já batiam com o mockup):
  - KPIs "Saldo em conta hoje", "A receber, 30 dias", "A pagar, 30 dias" e "A pagar vencido", e o resumo novo da faixa;
  - "Próximos 7, 15 e 30 dias" com saldo, caixa mínimo e o modo "Com a projeção": vendas novas pela média recebida (hachurado claro, no a receber) e contas a lançar pela média paga, escala igual nos dois modos e o valor do fim ao lado do traço ([CartaoProximosDias.tsx](src/components/CartaoProximosDias.tsx));
  - "Contas a pagar lançadas" por grupo de pagamento (fornecedores, custos fixos, despesas e impostos, dívida e capex), capex sem farol e com nota ([CartaoPagarLancado.tsx](src/components/CartaoPagarLancado.tsx));
  - cartão novo "Cobertura de caixa": dias, régua de 30 quadrados e os últimos 12 meses ([CartaoCobertura.tsx](src/components/CartaoCobertura.tsx));
  - "Inadimplência corrente" com o a vencer só na barra, com o texto dentro, e os quadros só para o vencido ([CartaoInadimplencia.tsx](src/components/CartaoInadimplencia.tsx));
  - correção: a inadimplência estourava a largura ao encolher a janela de 1100 para 390 px (coluna em `1fr` em vez de `minmax(0, 1fr)`).

  Conferido no navegador (Edge headless, 1440 px claro e escuro, nos dois modos, 1100 px e 390 px) com o mock.

- [x] 30/10/2026 · "Custos" no "Resultado mês a mês" (fixture), entre "Receita bruta" e "Margem de contribuição": 6 gráficos, 3 em cima e 3 embaixo. Conferido no navegador (Edge headless, 1440 px) com o mock.

- [x] 30/10/2026 · DRE gerencial: sem o código da conta na tela, valores cheios na fixture ("6.950.000", cabeçalho "Conta (R$)") e "$" ou "%" ao lado da faísca, conforme a `tendencia.unidade` de cada linha (% da receita bruta em Deduções, Custos, Despesas variáveis e EBITDA). Conferido no navegador (Edge headless, 1440 px) com o mock: a tabela cabe sem rolagem.

- [x] 30/10/2026 · Rótulos de mês com o ano ("out-25") nas fixtures quando a série cruza anos, e eixo x que mostra um rótulo sim, outro não quando o rótulo não cabe: o espaçamento passa a contar o tamanho do rótulo ([geometria.ts](src/charts/geometria.ts), em barras, linhas, combo e empilhado). Conferido no navegador (Edge headless, 1440 e 390 px) com o mock: tabela financeira sem rolagem, combos do Resultado e empilhados no celular sem rótulo encavalado.

- [x] 30/10/2026 · Grade de velocímetros da Visão geral acima de 4: 5 ficam 3 + 2, 6 ficam 3 + 3, 7 ficam 4 + 3 e 8 ficam 4 + 4; acima de 8, 4 por linha ([grade.ts](src/screens/visao-geral/grade.ts)). A linha de baixo, com menos cartões, divide a largura toda (grade em flex com quebra, [IndicadorGauge.css](src/components/IndicadorGauge.css)); até 1240 px, com 2 por linha, o último de uma quantidade ímpar ocupa a linha inteira. Conferido no navegador (Edge headless, 1440, 1100 e 390 px) com o seletor "Linhas de custo" do mock.

- [x] 30/10/2026 · Ciclo de caixa e Tabela financeira como no mockup Total M2.1.1:
  - "Ciclo de caixa" no Receber e pagar, no lugar de "Prazos": réguas de estoque, recebimento, pagamento e dinheiro preso, rodapé e o gráfico de prazos embaixo (cartão `ciclo-caixa`, [CicloCaixa.tsx](src/screens/paineis/CicloCaixa.tsx));
  - "Tabela financeira mês a mês" com a variante `tendencia`: números curtos ("6,64 mi", "26 d") e farol claro sem negrito, cabendo sem rolagem a 1440 px ([TabelaCartao.tsx](src/screens/paineis/TabelaCartao.tsx)).

  Conferido no navegador (Edge headless, 1440 px claro e escuro) com o mock.

- [x] 30/10/2026 · Painel Pessoas no visual do mockup Total M2.1.1, com dado fictício, no grupo **Pessoas** do menu: aviso de painel restrito, KPIs, o que mudou na equipe, faturamento por colaborador, colaboradores por setor (empilhado com os números e o total em cima), cada setor mês a mês, cargos e salários, folha por setor, admissões, desligamentos e turnover (chave por setor), turnover por setor, tempo de casa e produtividade por setor (escolher a linha troca o gráfico ao lado). Cartões novos `numero-grafico` ([NumeroGrafico.tsx](src/screens/paineis/NumeroGrafico.tsx)) e `lista-detalhe` ([ListaDetalhe.tsx](src/screens/paineis/ListaDetalhe.tsx)), `visoes` no cartão de gráficos, faísca compartilhada com a DRE ([Faisca.tsx](src/charts/Faisca.tsx)) e `casasMil` para reais em milhares com vírgula ("R$ 54,7 mil"). "Ver painel" de "Folha sobre a receita" leva a Pessoas. Conferido no navegador (Edge headless, 1440 px claro e escuro, 1100 px e 390 px) com o mock.

- [x] 28/10/2026 · Visão geral no visual do mockup M2.1.2, com dado fictício:
  - chave Mês/Acumulado em cada velocímetro (no lugar da chave única da tela), com a contagem da faixa seguindo a de cada cartão, seta no delta, delta em texto ("na meta") e link "Ver painel" para a tela do indicador;
  - nota no topo, "Pedidos por cliente" no lugar de "Linhas por cliente" e os novos números de Custos e Resultado;
  - seletor "Linhas de custo" (Automático 80% e 1 a 7, o resto em Outros), gravado para o cliente na API ([SeletorDaSecao.tsx](src/screens/visao-geral/SeletorDaSecao.tsx));
  - Financeiro só com cartões: "Próximos 7, 15 e 30 dias" com "Só o lançado" e "Com o que falta lançar", sem saldo ([CartaoProximosDias.tsx](src/components/CartaoProximosDias.tsx)), "Contas a pagar lançadas" ([CartaoPagarLancado.tsx](src/components/CartaoPagarLancado.tsx)) e "Inadimplência corrente" com as fitas da barra aos quadros ([CartaoInadimplencia.tsx](src/components/CartaoInadimplencia.tsx)), com título e subtítulo vindos do contrato;
  - barras em tons de grafite: azul, laranja e vermelho ficam só para status (decisão de 28/10/2026).

  Conferido no navegador (Edge headless, 1440 px claro e escuro, 1100 px e 390 px) com o mock.

- [x] 28/10/2026 · Painéis financeiros alinhados à API publicada: fixtures sem saldo bancário (sem os KPIs de saldo, o "Saldo no fim" e o status das janelas), sem PDD, "leitura rápida" em `chamada`, "parou de comprar" e "título vencido" em `etiqueta`, chance "sem histórico" como texto; linha de 3 KPIs sem buraco no fim ([Kpi.tsx](src/components/Kpi.tsx)). Testes cobrem a DRE só com os níveis 1 e 2, o padrão da API.

- [x] 26/10/2026 · Painéis financeiros no visual do mockup Total M2.0.1, com dado fictício, no grupo **Financeiro** do menu (no mockup, "Finanças"; o Caixa ficou de fora):
  - Resultado: destaques, apoios, resultado mês a mês contra o orçado (5 combos), DRE em cascata, ponto de equilíbrio, ponte do EBITDA, maiores desvios, DRE gerencial em árvore (níveis 1 a 3, abrir e fechar, "Só desvios", tendência de 6 meses) e tabela financeira;
  - Receber e pagar: KPIs, próximos 7, 15 e 30 dias, contas a receber × a pagar, quem cobrar hoje, a pagar por semana, inadimplência por mês de vencimento e em 12 meses, idade dos vencidos, prazos de recebimento e pagamento e clientes acima do limite.

  Cartões novos em [src/screens/paineis/](src/screens/paineis/) (`dre`, `barra-partes`, `desvios`, `janelas`, `dois-lados`, `barras-horizontais`), gráfico de cascata ([Cascata.tsx](src/charts/Cascata.tsx)), paleta de atraso no empilhado, pílula com texto na tabela e "Comparar com" na consulta do Resultado. Seguiram as recomendações: sem a caixa de marcar em "Quem cobrar hoje", títulos dos dois lados em cinza, sem o selo "Universal Completo" e sem o Ciclo de caixa (no lugar, só os prazos). Conferido no navegador (Edge headless, 1440 px claro e escuro, 390 px) com o mock.

- [x] 26/10/2026 · Trocar de tela pelo menu abre a tela nova no topo, e clicar na tela já aberta também volta ao topo; trocar só de filtro não mexe na rolagem. Ver [topo.ts](src/app/topo.ts), [Moldura.tsx](src/app/Moldura.tsx) e [Rail.tsx](src/components/Rail.tsx). Conferido no navegador (Edge, 1440 px).

- [x] 26/10/2026 · Botão "i" com a explicação do gráfico nos painéis comerciais: campo `explicacao` no cartão ([painel.ts](src/contracts/painel.ts)), caixa que fecha com Esc, clique fora, rolagem ou redimensionamento ([Explicacao.tsx](src/components/Explicacao.tsx)) e os 14 textos do mockup nas fixtures. O "vídeo curto" (V2) do mockup ficou de fora. Conferido no navegador (Edge, 1440 px).

- [x] 26/10/2026 · Painéis comerciais no visual do mockup Total M2.0.1, com dado fictício:
  - Vendas: régua do mês, estatísticas e acumulado dia a dia em degraus (Valor e Volume), fatores da meta, ritmo por dia útil, linhas de produto, canais, 12 meses e participação das linhas;
  - Equipe comercial: destaques, ranking contra a meta, rampa dos novos, mapa de produtividade, atingimento de 6 meses e report da equipe;
  - Clientes e atendimentos: atendimentos e ticket, dia da semana, faixas de valor, curva ABC, cruzamento receita × margem, itens que mais vendem e itens por atendimento.

  Contrato único de painel por cartões ([painel.ts](src/contracts/painel.ts)), filtros próprios da tela vindos do payload (Canal, Linha, Supervisor), grupo Comercial no rail e gráficos novos em [src/charts/](src/charts/) (barras, combo, linhas, empilhado, dispersão, degraus). Conferido no navegador (Edge, 1440 px claro e escuro, 390 px) com o mock.

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
