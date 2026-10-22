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
 * o `id` do período (AAAA-MM) e da empresa (UUID). Sem sessão, só fica o "Comparar com".
 * - Período: os meses com dados, o mais recente como padrão (é o que a API usa sem `mes`);
 * - Empresa: só aparece com mais de uma empresa no vínculo; o padrão é "Todas".
 */
export function montarFiltros(sessao: SessaoPayload | undefined): FiltrosDaTela {
  const periodos = sessao?.periodos ?? [];
  const empresas = sessao?.empresas ?? [];
  const defs: FiltroDef[] = [];

  const periodo: FiltroDef | undefined = periodos[0] && {
    id: 'periodo',
    rotulo: 'Período',
    opcoes: periodos.map((p) => p.rotulo),
    padrao: periodos[0].rotulo,
  };
  if (periodo) defs.push(periodo);
  defs.push(FILTRO_COMPARAR);

  const todas = `Todas (${empresas.length})`;
  const empresa: FiltroDef | undefined =
    empresas.length > 1
      ? { id: 'empresa', rotulo: 'Empresa', opcoes: [todas, ...empresas.map((e) => e.nome)], padrao: todas }
      : undefined;
  if (empresa) defs.push(empresa);

  return {
    defs,
    consulta(valores) {
      const filtros: FiltrosVisaoGeral = {};
      const rotuloPeriodo = periodo && valores[periodo.id];
      if (rotuloPeriodo && rotuloPeriodo !== periodo.padrao) {
        filtros.mes = periodos.find((p) => p.rotulo === rotuloPeriodo)?.id;
      }
      const nomeEmpresa = empresa && valores[empresa.id];
      if (nomeEmpresa && nomeEmpresa !== empresa.padrao) {
        filtros.empresa = empresas.find((e) => e.nome === nomeEmpresa)?.id;
      }
      return filtros;
    },
  };
}
