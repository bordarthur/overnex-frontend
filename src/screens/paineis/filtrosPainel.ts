import type { FiltrosPainel } from '../../api/client';
import type { FiltroDef } from '../../components/BarraFiltros';
import type { FiltroPainel } from '../../contracts/painel';
import type { FiltrosDaTela } from '../visao-geral/filtros';

/**
 * Junta os chips da sessão (Período, Comparar com, Empresa: os mesmos da Visão geral) com os
 * filtros próprios da tela, que vêm no payload. Os chips trabalham com rótulos; aqui eles viram
 * o `id` da opção. Só vai na consulta o que foi trocado.
 */
export function juntarFiltros(daSessao: FiltrosDaTela, daTela: FiltroPainel[]) {
  const proprios: FiltroDef[] = daTela.map((f) => ({
    id: f.id,
    rotulo: f.rotulo,
    opcoes: f.opcoes.map((o) => o.rotulo),
    padrao: f.opcoes.find((o) => o.id === f.padrao)?.rotulo ?? f.opcoes[0]?.rotulo ?? '',
  }));
  return {
    defs: [...daSessao.defs, ...proprios],
    consulta(valores: Record<string, string>): FiltrosPainel {
      const consulta: FiltrosPainel = {};
      const { mes, empresa } = daSessao.consulta(valores);
      if (mes) consulta.mes = mes;
      if (empresa) consulta.empresa = empresa;
      for (const f of daTela) {
        const rotulo = valores[f.id];
        const opcao = f.opcoes.find((o) => o.rotulo === rotulo);
        if (opcao && opcao.id !== f.padrao) consulta[f.id] = opcao.id;
      }
      return consulta;
    },
  };
}
