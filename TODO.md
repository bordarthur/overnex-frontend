# TODO · Overnex frontend

Lista viva do projeto. Atualizada ao fim de cada tarefa: o que foi feito vai para **Concluído** (com data), o que surgiu entra em **A fazer** ou **A decidir**.

Última atualização: 30/10/2026

## Em andamento

- [ ] **Painel Pessoas: testar com a API.** O back publicou `GET /api/telas/pessoas` (PES-01, confirmado) em 30/10/2026, no contrato de [painel.ts](src/contracts/painel.ts). A fixture ([pessoas.json](src/api/fixtures/pessoas.json)) segue os textos da API, e os testes cobrem a resposta enxuta (1 a 4 fatos em "O que mudou", 3 KPIs sem faturado, cartões a menos, um setor só na produtividade, "vs 6m" sem valor, segundo trecho do aviso quando o mês não tem folha). Falta abrir com `VITE_API_MODO=api` e conferir troca de mês e empresa, a chave de setor encolhida, o estado vazio e o 403 de quem não tem PES-01. Não foi testado em 30/10 pelo mesmo motivo dos painéis financeiros (abaixo): a API local lê o banco de produção, e o token fake não pode ser usado assim.

- [ ] **Visão geral no mockup M2.1.2: testar com a API.** O back publicou em 28/10/2026 o contrato novo, que bate com [visaoGeral.ts](src/contracts/visaoGeral.ts), conferido campo a campo contra o `api/openapi.json` do back (os tipos do front continuam escritos à mão; não há gerador). O front já trata o que o back avisou:
  - Financeiro com 4 KPIs ("A receber vencido" entrou na fixture);
  - "Próximos 7, 15 e 30 dias" com um modo só ("lancado"), sem a chave de modos, quando o cliente não tem pagamento nos meses fechados;
  - PUT da escolha com a `empresa` da tela, o texto da API no 403, 404 e 422, e o seletor travado para o papel "leitor" ([SeletorDaSecao.tsx](src/screens/visao-geral/SeletorDaSecao.tsx)).

  Falta abrir com `VITE_API_MODO=api` e conferir: trocar as linhas de custo, recarregar e ver a escolha mantida, o 403 com um usuário leitor e o Financeiro sem os velocímetros de prazo. Não foi testado em 28/10 pelo mesmo motivo dos painéis financeiros (abaixo): o `api/.env` do back aponta para o banco de produção com `AUTH_FAKE=1`.

- [ ] **Painéis financeiros (Resultado, Receber e pagar): testar com a API.** O back publicou `GET /api/telas/resultado` (FIN-02) e `/api/telas/receber-pagar` (FIN-03) em 28/10/2026, e o contrato bate com [painel.ts](src/contracts/painel.ts) (conferido campo a campo contra o `api/openapi.json` do back). As fixtures foram ajustadas ao que a API manda. Falta abrir as duas telas com `VITE_API_MODO=api` e conferir: filtros Visão, Orçamento, Vendedor e Atraso, "Comparar com" (`?comparar=mes-anterior`), troca de mês e empresa, o `aviso` sem orçado, o estado vazio e o 403 do FIN-03 para perfil sem dado nominal. Não foi testado em 28/10 porque o `api/.env` do back aponta para o banco de produção com `AUTH_FAKE=1`, e o README do back proíbe usar o token fake assim: testar com o login real (`VITE_AUTH_MODO=api`) ou com a API apontada para um banco local.

- [ ] **Painéis comerciais (Vendas, Equipe comercial, Clientes): ligar à API.** O front está pronto com as fixtures do mockup Total M2.0.1 ([painel.ts](src/contracts/painel.ts), [PainelTela.tsx](src/screens/paineis/PainelTela.tsx), fixtures em [src/api/fixtures/](src/api/fixtures/)). Falta o back criar `GET /api/telas/vendas`, `/api/telas/equipe-comercial` e `/api/telas/clientes` nesse contrato (prompt entregue em 26/10/2026) e testar com `VITE_API_MODO=api`: filtros Canal, Linha e Supervisor indo na consulta, troca de mês e empresa, estados vazio e sem permissão. O back também precisa mandar `explicacao` nos cartões (prompt entregue em 26/10/2026); sem ela, o botão "i" não aparece.

- [ ] **Login com e-mail e senha: ligar à API.** O front está pronto e funciona com o login fake ([AuthProvider.tsx](src/auth/AuthProvider.tsx), [authClient.ts](src/auth/authClient.ts), telas em [screens/login/](src/screens/login/)). Falta o back criar `/api/auth/*` no contrato de [auth.ts](src/contracts/auth.ts) (Supabase Auth com refresh em cookie httpOnly; prompt entregue em 23/10/2026) e testar com `VITE_AUTH_MODO=api`: entrar, recarregar e continuar logado, renovação depois de vencer o token, sair, convite e recuperação de senha pelo e-mail. Com o mockup Login M2.0.0, o back também precisa:
  - mandar 429 com `Retry-After` quando houver tentativas demais;
  - mandar 410 para link vencido ou já usado;
  - usar os textos do mockup ("E-mail ou senha não conferem. Confira os dois e tente de novo.", "Foram 5 tentativas com a senha errada.");
  - configurar a política de senha igual a [senha.ts](src/auth/senha.ts) (8 caracteres, maiúscula e número).
- [ ] **Conferir as telas de acesso no navegador** (claro, escuro, celular em 360 px, movimento reduzido) contra o mockup Login M2.0.0. Os testes cobrem o comportamento, mas ninguém viu as telas ainda.

- [ ] **Medir o ganho dos pedidos adiantados no navegador.** Aba Network com a API local: tempo do login até a primeira tela e da troca de mês, antes e depois. Não foi medido em 23/10/2026 porque a API local respondia 500 em `/api/sessao` e na Visão geral. Para o "antes", rodar o commit anterior a esta mudança. Ver [adiantar.ts](src/api/adiantar.ts).

## A fazer

- [ ] **Painéis comerciais, partes do mockup que ficaram de fora:** "Mix por cliente" (cartão V2 de Vendas), "Mostrar fontes de dados" e a carteira cliente a cliente ("Carteira de clientes", módulo Distribuidora). Ver [CartaoPainel.tsx](src/screens/paineis/CartaoPainel.tsx).
- [ ] **Menu pelas telas liberadas.** O rail mostra Vendas, Equipe comercial, Clientes, Resultado, Receber e pagar e Pessoas para todos; esconder quando o código (`COM-01` a `COM-03`, `FIN-02`, `FIN-03` e `PES-01`) não vier em `telas` de `/api/sessao`. Pesa mais no FIN-03, que exige perfil com dado nominal, e no Pessoas, só para diretoria e RH (decisão de 30/10/2026: por ora, mostrar para todos): sem ele, a pessoa vê o item no menu e cai em "Você não tem acesso". Ver [Rail.tsx](src/components/Rail.tsx).
- [ ] **Pedidos adiantados dos painéis comerciais.** Hoje só a Visão geral é adiantada; avaliar adiantar Vendas depois da primeira tela. Ver [adiantar.ts](src/api/adiantar.ts) e [usePainel.ts](src/api/usePainel.ts).

- [ ] **Configurar o GitHub para colaboradores** (front e back), como em [CONTRIBUTING.md](CONTRIBUTING.md): branch `dev`, GitHub App com `APP_ID` e `APP_PRIVATE_KEY`, rulesets em `main` e `dev` (PR com 1 aprovação, CODEOWNERS, checks obrigatórios `verificar` no front e `api` e `carga` no back, App e Admin no bypass) e colaboradores com papel Write. Sem isso, o CI roda mas a automação de PR falha no primeiro passo.

- [ ] **Slug da URL diferente do cliente da sessão.** Na API, o cliente sai do token: em `/outro-slug/visao-geral` a pessoa vê os dados do próprio cliente com outro nome na URL. Redirecionar para `/${sessao.cliente.slug}/…` quando forem diferentes. Ver [Guardas.tsx](src/app/Guardas.tsx).
- [ ] **Visão de administrador da LANN.** Um usuário que vê vários clientes e escolhe qual abrir. Precisa de: back resolver o cliente pela URL para usuários `tipo='lann'` (hoje quem tem mais de um cliente é barrado no passo 2), `/api/sessao` listar os clientes e um seletor de cliente no front. Por ora o usuário da diretoria fica só na PJ Cortes.
- [ ] **Filtro "Comparar com" de verdade.** Período e Empresa já vêm de `/api/sessao` e vão na consulta; "Comparar com" ainda só troca o rótulo (a API não tem esse parâmetro). Ver [filtrosDemo.ts](src/screens/visao-geral/filtrosDemo.ts).
- [ ] **Cartão "Cobertura de caixa" (mockup M2.1.2).** Ficou de fora até o back ter o saldo em conta (decisão de 28/10/2026). Quando entrar, vai ao lado de "Contas a pagar lançadas", em duas colunas; o "Próximos 7, 15 e 30 dias" já aceita `saldo` e `minimo` (caixa mínimo) sem mudar o front. Ver [CartaoProximosDias.tsx](src/components/CartaoProximosDias.tsx).
- [ ] **"Ver painel" para o Caixa.** O link só aparece quando a tela de `telaDestino` existe no front; "Dívida líquida / EBITDA" aponta para `caixa`, que ainda não existe ("Folha sobre a receita" já leva a Pessoas). Ver [SecaoVisaoGeral.tsx](src/screens/visao-geral/SecaoVisaoGeral.tsx).
- [ ] **Logo do cliente no co-branding.** A CSP só aceita `img-src 'self'`, então a API precisa servir o logo. Ver [Cabecalho.tsx](src/components/Cabecalho.tsx).

### Integração com o banco (análise do overnex-backend em 16/10/2026)

O que o back precisa criar está na seção "Para o front consumir (Visão geral)" do `TODO.md` do `overnex-backend`. Do lado do front:

- [ ] **Testar o cliente HTTP contra a API local** com `VITE_API_MODO=api`, quando a API subir nesta máquina (depende do item abaixo).
- [ ] **Gerar os tipos do contrato a partir do OpenAPI do back**, quando o contrato da Visão geral existir lá, e apagar `src/contracts/visaoGeral.ts` escrito à mão.
- [ ] **Resto do `GET /api/sessao`:** cliente e logo no cabeçalho e telas liberadas no menu. Os filtros Período e Empresa já usam a sessão ([filtros.ts](src/screens/visao-geral/filtros.ts)).
- [ ] **`?mes=` no back.** O front já manda `mes` (AAAA-MM) e `empresa` na Visão geral, mas a API ainda ignora `mes` e lista só o mês do snapshot em `/api/sessao`: escolher outro mês devolve os mesmos números. Pedido ao back em 22/10/2026.
- [ ] **Telas que lerem `GET /api/dados/{tabela}`:** nenhuma lê hoje. Quando alguma ler, pegar nomes de tabela e coluna da PJ Cortes (`f_vendas_pj`, `d_cliente_pj`…), não os da Nilo Maia, que foram apagados do banco.
- [ ] **Conferir Resultado e Financeiro com a API** depois da primeira carga da PJ Cortes. As duas seções vêm do back, com regras provisórias, e o Resultado mostra menos que a fixture: sem "EBITDA projetado" e "Dívida líquida / EBITDA" (o back não tem fonte). O Financeiro passa a ter só cartões (ver "Visão geral no mockup M2.1.2" acima). Ver o `TODO.md` do `overnex-backend`.
- [ ] **Ambiente local da API.** Esta máquina não tem Docker nem Supabase CLI, e o `api/.env` do back não existe.

## A decidir

- [ ] **Painel Pessoas, partes do mockup M2.1.1 que ficaram de fora ou mudaram** (decidir com o usuário). Ver [pessoas.json](src/api/fixtures/pessoas.json):
  - cartão V2 "Módulo de analista de RH" e a chave "Mostrar nomes" de "Cargos e salários" (perfil RH, desabilitada no mockup);
  - chip "Setor" no topo: ficou só a chave dentro de "Admissões, desligamentos e turnover" (decisão de 30/10/2026);
  - admissões e desligamentos em grafite escuro e claro, não em azul e laranja (azul, laranja e vermelho ficam para status); os minigráficos de "Cada setor, mês a mês" também saíram em grafite, sem o quadradinho da cor do setor no título;
  - o empilhado "Colaboradores por setor" usa a paleta do mockup, que tem azul no Estoque e no Financeiro (mesma questão do item "Cores… fora de status", abaixo);
  - no celular, "Indicador" some da produtividade (o título do gráfico ao lado diz qual é);

- [ ] **Painéis financeiros, partes do mockup que não encaixam nas regras ou no back** (decidir com o usuário). Onde havia recomendação, o front já a seguiu; falta confirmar:
  - cartões marcados "A decidir" no mockup (Ponte do EBITDA, Maiores desvios, Nível 3 da DRE e Tabela financeira): estão nas fixtures; o back só os manda depois da aprovação;
  - sem fonte no back: saldo em conta, "Saldo em 30 dias", "Saldo no fim" das janelas e o Ciclo de caixa (falta prazo de estoque a custo). O front mostra se vierem; no lugar do Ciclo, só o gráfico de prazos;
  - PDD ("regra a definir") e limite de crédito (`en_limitecredito` existe na PJ?);
  - "Quem cobrar hoje" ficou sem a caixa de marcar (sem gravar no back, a marcação sumiria ao recarregar);
  - títulos "Contas a receber" e "Contas a pagar" em cinza (no mockup, azul e vermelho: cor de status usada como enfeite). Pelo mesmo motivo, "A receber" e "A pagar" das janelas também ficaram sem cor;
  - selo "Universal Completo" no menu e no cabeçalho: ficou de fora;
  - "Comparar com" vai na consulta do Resultado só com "Mês anterior"; "Meta comercial" e "Mesmo mês de 2025" continuam só no rótulo. Ver [filtrosPainel.ts](src/screens/paineis/filtrosPainel.ts);
  - "parou de comprar" e "título vencido" vêm como `etiqueta` da tabela, que é azul (a cor de `--ok`, como a "rampa" da Equipe). No mockup elas eram vermelhas. Deixar as etiquetas cinza, ou pedir ao back um tom na etiqueta? Ver [TabelaCartao.tsx](src/screens/paineis/TabelaCartao.tsx).
- [ ] **Explicação ("i") dos cartões que o mockup não explica:** Linhas de produto, Vendas nos últimos 12 meses, Participação das linhas, Movimento por dia da semana, Itens que mais vendem, Itens por atendimento e todos os cartões de Pessoas. Escrever os textos ou deixar sem "i"? Na Visão geral, os cartões do Financeiro já aceitam `explicacao`; a inadimplência fica sem, porque o mockup não traz texto para ela. Ver [Explicacao.tsx](src/components/Explicacao.tsx).

- [ ] **Cores que o mockup dos painéis comerciais usa fora de status** (decidir com o usuário). O azul de `--ok` e o laranja de `--warn-mark` aparecem como cor de série: 5ª e 7ª linha no empilhado de participação, a linha de cima dos combos e a barra de projeção de outubro em Atendimentos. Foi mantido como no mockup; trocar por cinzas evita confundir com status. Ver [charts.css](src/charts/charts.css).

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
- [ ] **Partes do mockup Visão geral M2.1.2 que ficaram de fora ou mudaram** (decidir com o usuário):
  - "Placar das áreas" (marcado V2), seções Compras e Estoque (Módulo Distribuidora, fora do escopo universal) e o botão "Etiquetas internas" com os selos "Universal Completo", "fonte a definir" e "nome a validar";
  - o KPI "Saldo em conta hoje" saiu da fixture (sem fonte no back), e o "Próximos 7, 15 e 30 dias" começa em zero: mostra quanto sobra ou falta na janela, não onde o caixa termina;
  - status das janelas sem saldo: na fixture, sobra = saudável e falta = atenção. Qual regra o back usa?
  - "Inadimplência corrente": o mockup marca o nome como "nome a validar";
- [ ] **Aviso "este filtro só muda o rótulo".** O mockup mostra um aviso ao trocar filtro; ficou de fora. Incluir enquanto os filtros não funcionam?
- [ ] **Botão "Mostrar fontes de dados".** Ficou de fora desta entrega. Entra em qual?

## Concluído

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
