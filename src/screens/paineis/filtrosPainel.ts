import type { FiltrosPainel } from '../../api/client';
import type { FiltroDef } from '../../components/BarraFiltros';
import type { FiltroPainel } from '../../contracts/painel';
import type { FiltrosDaTela } from '../visao-geral/filtros';
import type { ChaveDoCartao } from './consultaPainel';

/** Opções do chip "Comparar com" que a API entende (`?comparar=`). "Orçado" é o padrão e não vai. */
const COMPARAR: Record<string, string> = { 'Mês anterior': 'mes-anterior' };

/**
 * Junta os chips da sessão (Período, Comparar com, Empresa: os mesmos da Visão geral) com os
 * filtros próprios da tela, que vêm no payload. Os chips trabalham com rótulos; aqui eles viram
 * o `id` da opção. Só vai na consulta o que foi trocado. Com `comparar`, o "Comparar com" também
 * vai (por enquanto só no Resultado; nas outras telas ele continua só no rótulo). Com
 * `semComparar`, o chip some (o Fluxo de caixa não tem orçado para comparar).
 */
export function juntarFiltros(
  daSessao: FiltrosDaTela,
  daTela: FiltroPainel[],
  { comparar = false, semComparar = false }: { comparar?: boolean; semComparar?: boolean } = {},
) {
  // o filtro com `cartao` vira a chave no cabeçalho daquele cartão, fora da barra
  const proprios: FiltroDef[] = daTela
    .filter((f) => !f.cartao)
    .map((f) => ({
      id: f.id,
      rotulo: f.rotulo,
      opcoes: f.opcoes.map((o) => o.rotulo),
      padrao: f.opcoes.find((o) => o.id === f.padrao)?.rotulo ?? f.opcoes[0]?.rotulo ?? '',
    }));
  return {
    defs: [...daSessao.defs.filter((d) => !(semComparar && d.id === 'comparar')), ...proprios],
    /**
     * As chaves que ficam nos cartões, por id do cartão: a opção escolhida (pelo rótulo guardado em
     * `valores`, ou a padrão) e como trocar.
     */
    noCartao(
      valores: Record<string, string>,
      mudar: (id: string, rotulo: string) => void,
    ): Record<string, ChaveDoCartao> {
      return Object.fromEntries(
        daTela.flatMap((f) =>
          f.cartao
            ? [
                [
                  f.cartao,
                  {
                    rotulo: f.rotulo,
                    opcoes: f.opcoes,
                    valor: f.opcoes.find((o) => o.rotulo === valores[f.id])?.id ?? f.padrao,
                    onMudar: (id: string) => {
                      const opcao = f.opcoes.find((o) => o.id === id);
                      if (opcao) mudar(f.id, opcao.rotulo);
                    },
                  },
                ],
              ]
            : [],
        ),
      );
    },
    /** Os valores sem os filtros da barra: "Limpar filtros" não mexe nas chaves dos cartões. */
    limpar(valores: Record<string, string>): Record<string, string> {
      const ficam = new Set(daTela.filter((f) => f.cartao).map((f) => f.id));
      return Object.fromEntries(Object.entries(valores).filter(([id]) => ficam.has(id)));
    },
    consulta(valores: Record<string, string>): FiltrosPainel {
      const consulta: FiltrosPainel = {};
      const { mes, empresa } = daSessao.consulta(valores);
      if (mes) consulta.mes = mes;
      if (empresa) consulta.empresa = empresa;
      const rotuloComparar = valores.comparar;
      if (comparar && !semComparar && rotuloComparar && COMPARAR[rotuloComparar])
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
