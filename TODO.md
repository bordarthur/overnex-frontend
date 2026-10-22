# TODO · Overnex frontend

Lista viva do projeto. Atualizada ao fim de cada tarefa: o que foi feito vai para **Concluído** (com data), o que surgiu entra em **A fazer** ou **A decidir**.

Última atualização: 22/10/2026

## Em andamento

_Nada no momento._

## A fazer

- [ ] **Login com Microsoft Entra.** Trocar o `AuthProviderFake` por um provider com MSAL. Ver [AuthProviderFake.tsx](src/auth/AuthProviderFake.tsx).
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

- [ ] **Histórico x espaço no banco.** A Visão geral pede 6 meses de tendência e 12 de inadimplência, mas as tabelas de movimento estão com janela de 1 mês (Supabase gratuito perto de 500 MB). Guardar agregados mensais, aumentar a janela ou mudar de plano?
- [ ] **Regras de negócio dos indicadores.** Qual tabela e qual conta geram cada indicador (meta, orçado, CMV por linha, cobertura de caixa, ciclo de caixa, faixas do farol). O back ainda não tem nenhuma regra definida.
- [ ] **Dias úteis da seção Vendas.** "Projeção de fechamento" e "A realizar por dia útil" dependem de quais dias contam: sábado entra? Feriados só nacionais ou também estaduais e municipais por empresa? O back ainda não tem calendário. A regra do status desses dois cards também está em aberto. Ver o `vendas.py` do back.
- [ ] **Contra qual banco testar localmente.** Supabase local (precisa de Docker) ou o de produção (precisa da senha do `api_site`, ainda não definida).

- [ ] **Legenda dos velocímetros.** Foi incluída a pedido, mas o mockup não a mostra e ela deixa cada cartão 48px mais alto. Manter ou tirar?
- [ ] **Título e subtítulo do cartão de Inadimplência.** Hoje estão fixos no componente porque o contrato não os traz. Incluir no contrato?
- [ ] **Aviso "este filtro só muda o rótulo".** O mockup mostra um aviso ao trocar filtro; ficou de fora. Incluir enquanto os filtros não funcionam?
- [ ] **Botão "Mostrar fontes de dados".** Ficou de fora desta entrega. Entra em qual?

## Concluído

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
