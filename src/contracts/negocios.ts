// Negócios do cliente escolhido: setor › grupo › unidade (a bandeja "Negócios" do mockup M3.1.0).
// Espelha o cadastro de unidades do back (cfg.empresa): cada unidade tem setor, segmento, grupo e
// endereço, e pertence a um cliente. Ex.: Leão de Ouro (cliente) › Varejo (setor) › Lupo (grupo) ›
// Lupo 1 (unidade).
//
// O front não calcula: a árvore, os valores e o escopo de cada painel vêm prontos da API. O front só
// guarda quais unidades estão marcadas e as manda em `?unidades=` de toda chamada de tela.

import type { Valor } from './visaoGeral';

/** Um grupo de negócio (Leão, Lupo, Usaflex) e as unidades dele, pelos ids de `empresas` da sessão. */
export interface GrupoNegocio {
  id: string;
  rotulo: string;
  unidades: string[];
}

export interface SetorNegocio {
  // o id de cfg.setor: distribuidora, industria, varejo, servicos
  id: string;
  rotulo: string;
  grupos: GrupoNegocio[];
}

/**
 * A árvore da bandeja, em `negocios` de GET /api/sessao. Só vem quando o cliente tem mais de um
 * negócio (mais de um grupo); com um só, vem null e a unidade se escolhe no chip "Unidade" da barra.
 */
export interface NegociosSessao {
  // na ordem da bandeja; cada unidade aparece em um grupo só
  setores: SetorNegocio[];
  // código da tela → setores em que ela vale (o Estoque: ["distribuidora"]). Tela fora daqui vale em
  // todos. O menu esconde a tela quando nenhuma unidade marcada é de um desses setores.
  telasPorSetor: Record<string, string[]>;
}

/**
 * GET /api/negocios?cliente=<slug>&mes=<AAAA-MM>: os valores da bandeja, pedidos só quando ela abre.
 * Cada valor é o do setor, grupo ou unidade inteiro, sem olhar o que está marcado.
 */
export interface NegociosValores {
  // "Valores: faturado de 1º a 12/10"
  rotulo: string;
  // por id do setor, do grupo e da unidade
  setores: Record<string, Valor>;
  grupos: Record<string, Valor>;
  unidades: Record<string, Valor>;
}

/**
 * `escopo` do PainelPayload: o painel só vale em alguns setores e soma só as unidades deles. Na
 * bandeja, os outros setores ficam travados, com o `rotulo` no rodapé. Sem nenhuma unidade de um
 * desses setores marcada, a API responde com o `aviso` e sem cartões.
 */
export interface EscopoSetor {
  setores: string[];
  // "Este painel soma só a Distribuidora"
  rotulo: string;
}
