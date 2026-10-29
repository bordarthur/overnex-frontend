import type { FiltrosPainel } from '../../api/client';
import type { FiltroDef } from '../../components/BarraFiltros';
import type { FiltroPainel } from '../../contracts/painel';
import type { FiltrosDaTela } from '../visao-geral/filtros';

/** Opções do chip "Comparar com" que a API entende (`?comparar=`). "Orçado" é o padrão e não vai. */
const COMPARAR: Record<string, string> = { 'Mês anterior': 'mes-anterior' };

/**
 * Junta os chips da sessão (Período, Comparar com, Empresa: os mesmos da Visão geral) com os
 * filtros próprios da tela, que vêm no payload. Os chips trabalham com rótulos; aqui eles viram
 * o `id` da opção. Só vai na consulta o que foi trocado. Com `comparar`, o "Comparar com" também
 * vai (por enquanto só no Resultado; nas outras telas ele continua só no rótulo).
 */
export function juntarFiltros(
  daSessao: FiltrosDaTela,
  daTela: FiltroPainel[],
  { comparar = false }: { comparar?: boolean } = {},
) {
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
      const rotuloComparar = valores.comparar;
      if (comparar && rotuloComparar && COMPARAR[rotuloComparar])
        consulta.comparar = COMPARAR[rotuloComparar];
      for (const f of daTela) {
        const rotulo = valores[f.id];
        const opcao = f.opcoes.find((o) => o.rotulo === rotulo);
        if (opcao && opcao.id !== f.padrao) consulta[f.id] = opcao.id;
      }
      return consulta;
    },
  };
}
