# TODO · Overnex frontend

Lista viva do projeto. Atualizada ao fim de cada tarefa: o que foi feito vai para **Concluído** (com data), o que surgiu entra em **A fazer** ou **A decidir**.

Última atualização: 16/10/2026

## Em andamento

_Nada no momento._

## A fazer

- [ ] **Login com Microsoft Entra.** Trocar o `AuthProviderFake` por um provider com MSAL. Ver [AuthProviderFake.tsx](src/auth/AuthProviderFake.tsx).
- [ ] **Cliente HTTP da API.** Trocar o mock pelo cliente real, enviando o token do `useAuth`. Ver [Providers.tsx](src/app/Providers.tsx).
- [ ] **Filtros de verdade.** As opções de Período, Comparar com e Empresa devem vir da API, e o valor escolhido deve ir na consulta. Hoje só o rótulo do chip muda. Ver [filtrosDemo.ts](src/screens/visao-geral/filtrosDemo.ts).
- [ ] **Clique no indicador.** O cartão deve virar link para a tela em `telaDestino` assim que ela existir. Ver [IndicadorGauge.tsx](src/components/IndicadorGauge.tsx).
- [ ] **Logo do cliente no co-branding.** A CSP só aceita `img-src 'self'`, então a API precisa servir o logo. Ver [Cabecalho.tsx](src/components/Cabecalho.tsx).

## A decidir

- [ ] **Legenda dos velocímetros.** Foi incluída a pedido, mas o mockup não a mostra e ela deixa cada cartão 48px mais alto. Manter ou tirar?
- [ ] **Rótulos da série de inadimplência.** O contrato traz só "jun"; o tooltip do mockup mostra "jun/26". Mandar o rótulo completo na série?
- [ ] **Título e subtítulo do cartão de Inadimplência.** Hoje estão fixos no componente porque o contrato não os traz. Incluir no contrato?
- [ ] **Aviso "este filtro só muda o rótulo".** O mockup mostra um aviso ao trocar filtro; ficou de fora. Incluir enquanto os filtros não funcionam?
- [ ] **Botão "Mostrar fontes de dados".** Ficou de fora desta entrega. Entra em qual?

## Concluído

- [x] 16/10/2026 · Esqueleto do front: React + TypeScript + Vite, rotas, TanStack Query, Vitest, ESLint e Prettier.
- [x] 16/10/2026 · Painel Visão geral com a fixture (Vendas, Custos, Resultado e Financeiro), tema claro, escuro e automático, layout responsivo.
- [x] 16/10/2026 · Marca oficial extraída do mockup, CSP restritiva e bloqueio de `innerHTML` no lint.
- [x] 16/10/2026 · Projeto movido para a raiz do repositório; mockup retirado (não é guardado no repositório).
