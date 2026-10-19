# TODO · Overnex frontend

Lista viva do projeto. Atualizada ao fim de cada tarefa: o que foi feito vai para **Concluído** (com data), o que surgiu entra em **A fazer** ou **A decidir**.

Última atualização: 19/10/2026

## Em andamento

_Nada no momento._

## A fazer

- [ ] **Login com Microsoft Entra.** Trocar o `AuthProviderFake` por um provider com MSAL. Ver [AuthProviderFake.tsx](src/auth/AuthProviderFake.tsx).
- [ ] **Filtros de verdade.** As opções de Período, Comparar com e Empresa devem vir da API, e o valor escolhido deve ir na consulta. Hoje só o rótulo do chip muda. Ver [filtrosDemo.ts](src/screens/visao-geral/filtrosDemo.ts).
- [ ] **Clique no indicador.** O cartão deve virar link para a tela em `telaDestino` assim que ela existir. Ver [IndicadorGauge.tsx](src/components/IndicadorGauge.tsx).
- [ ] **Logo do cliente no co-branding.** A CSP só aceita `img-src 'self'`, então a API precisa servir o logo. Ver [Cabecalho.tsx](src/components/Cabecalho.tsx).

### Integração com o banco (análise do overnex-backend em 16/10/2026)

O que o back precisa criar está na seção "Para o front consumir (Visão geral)" do `TODO.md` do `overnex-backend`. Do lado do front:

- [ ] **Parâmetros da Visão geral.** A API não usa o slug da URL (o cliente sai do token) e pede `empresa` (UUID) e `mes` (`AAAA-MM`). `obterVisaoGeral` e a `queryKey` de `useVisaoGeral` devem receber esses valores dos filtros quando o `GET /api/telas/visao-geral` existir. Ver [httpClient.ts](src/api/httpClient.ts) e [useVisaoGeral.ts](src/api/useVisaoGeral.ts).
- [ ] **Testar o cliente HTTP contra a API local** com `VITE_API_MODO=api`, quando a API subir nesta máquina (depende do item abaixo).
- [ ] **Gerar os tipos do contrato a partir do OpenAPI do back**, quando o contrato da Visão geral existir lá, e apagar `src/contracts/visaoGeral.ts` escrito à mão.
- [ ] **Consumir `GET /api/sessao`:** cliente e logo no cabeçalho, empresas no filtro "Empresa", telas liberadas no menu.
- [ ] **Ambiente local da API.** Esta máquina não tem Docker nem Supabase CLI, e o `api/.env` do back não existe.

## A decidir

- [ ] **Histórico x espaço no banco.** A Visão geral pede 6 meses de tendência e 12 de inadimplência, mas as tabelas de movimento estão com janela de 1 mês (Supabase gratuito perto de 500 MB). Guardar agregados mensais, aumentar a janela ou mudar de plano?
- [ ] **Regras de negócio dos indicadores.** Qual tabela e qual conta geram cada indicador (meta, orçado, CMV por linha, cobertura de caixa, ciclo de caixa, faixas do farol). O back ainda não tem nenhuma regra definida.
- [ ] **Dias úteis da seção Vendas.** "Projeção de fechamento" e "A realizar por dia útil" dependem de quais dias contam: sábado entra? Feriados só nacionais ou também estaduais e municipais por empresa? O back ainda não tem calendário. A regra do status desses dois cards também está em aberto. Ver o `vendas.py` do back.
- [ ] **Contra qual banco testar localmente.** Supabase local (precisa de Docker) ou o de produção (precisa da senha do `api_site`, ainda não definida).

- [ ] **Legenda dos velocímetros.** Foi incluída a pedido, mas o mockup não a mostra e ela deixa cada cartão 48px mais alto. Manter ou tirar?
- [ ] **Rótulos da série de inadimplência.** O contrato traz só "jun"; o tooltip do mockup mostra "jun/26". Mandar o rótulo completo na série?
- [ ] **Título e subtítulo do cartão de Inadimplência.** Hoje estão fixos no componente porque o contrato não os traz. Incluir no contrato?
- [ ] **Aviso "este filtro só muda o rótulo".** O mockup mostra um aviso ao trocar filtro; ficou de fora. Incluir enquanto os filtros não funcionam?
- [ ] **Botão "Mostrar fontes de dados".** Ficou de fora desta entrega. Entra em qual?

## Concluído

- [x] 19/10/2026 · Grade de velocímetros com tantas colunas quantos indicadores (até 4), e velocímetro limitado a 400px de largura quando o cartão alarga. Ver [SecaoVisaoGeral.tsx](src/screens/visao-geral/SecaoVisaoGeral.tsx) e [IndicadorGauge.css](src/components/IndicadorGauge.css).

- [x] 19/10/2026 · Cliente HTTP da API ([httpClient.ts](src/api/httpClient.ts)), com token do `useAuth`, escolhido por `VITE_API_MODO` em [Providers.tsx](src/app/Providers.tsx); proxy `/api` → `127.0.0.1:8000` no [vite.config.ts](vite.config.ts).
- [x] 19/10/2026 · Token do `AuthProviderFake` no formato `fake:<object_id>` aceito pela API local com `AUTH_FAKE=1` (padrão: Ana do seed). Ver [AuthProviderFake.tsx](src/auth/AuthProviderFake.tsx).

- [x] 16/10/2026 · Esqueleto do front: React + TypeScript + Vite, rotas, TanStack Query, Vitest, ESLint e Prettier.
- [x] 16/10/2026 · Painel Visão geral com a fixture (Vendas, Custos, Resultado e Financeiro), tema claro, escuro e automático, layout responsivo.
- [x] 16/10/2026 · Marca oficial extraída do mockup, CSP restritiva e bloqueio de `innerHTML` no lint.
- [x] 16/10/2026 · Projeto movido para a raiz do repositório; mockup retirado (não é guardado no repositório).
