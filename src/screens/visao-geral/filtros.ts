import type { FiltrosVisaoGeral } from '../../api/client';
import type { FiltroDef } from '../../components/BarraFiltros';
import type { SessaoPayload } from '../../contracts/sessao';
import { FILTRO_COMPARAR } from './filtrosDemo';

export interface FiltrosDaTela {
  defs: FiltroDef[];
  /** Rótulos escolhidos nos chips → parâmetros da consulta. O padrão não vai na consulta. */
  consulta: (valores: Record<string, string>) => FiltrosVisaoGeral;
}

/**
 * Chips da Visão geral a partir de /api/sessao. Os chips trabalham com rótulos; aqui eles viram
 * o `id` do período (AAAA-MM) e da unidade. Sem sessão, só fica o "Comparar com".
 * - Período: os meses com dados, o mais recente como padrão (é o que a API usa sem `mes`);
 * - Unidade: só para cliente com um negócio só (`negocios` null) e mais de uma unidade; o padrão é
 *   "Todas". Com mais de um negócio, a escolha é pela bandeja "Negócios", que fica na URL e chega
 *   aqui em `bandeja` (os ids marcados, separados por vírgula; sem ele, todas).
 */
export function montarFiltros(sessao: SessaoPayload | undefined, bandeja?: string): FiltrosDaTela {
  const periodos = sessao?.periodos ?? [];
  const unidades = sessao?.empresas ?? [];
  const defs: FiltroDef[] = [];

  const periodo: FiltroDef | undefined = periodos[0] && {
    id: 'periodo',
    rotulo: 'Período',
    opcoes: periodos.map((p) => p.rotulo),
    padrao: periodos[0].rotulo,
  };
  if (periodo) defs.push(periodo);
  defs.push(FILTRO_COMPARAR);

  const todas = `Todas (${unidades.length})`;
  const unidade: FiltroDef | undefined =
    !sessao?.negocios && unidades.length > 1
      ? { id: 'unidade', rotulo: 'Unidade', opcoes: [todas, ...unidades.map((e) => e.nome)], padrao: todas }
      : undefined;
  if (unidade) defs.push(unidade);

  return {
    defs,
    consulta(valores) {
      const filtros: FiltrosVisaoGeral = {};
      const rotuloPeriodo = periodo && valores[periodo.id];
      if (rotuloPeriodo && rotuloPeriodo !== periodo.padrao) {
        filtros.mes = periodos.find((p) => p.rotulo === rotuloPeriodo)?.id;
      }
      const nomeUnidade = unidade && valores[unidade.id];
      if (nomeUnidade && nomeUnidade !== unidade.padrao) {
        filtros.unidades = unidades.find((e) => e.nome === nomeUnidade)?.id;
      }
      if (sessao?.negocios && bandeja) filtros.unidades = bandeja;
      return filtros;
    },
  };
}
