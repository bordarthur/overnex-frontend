import type { Cartao } from '../../contracts/painel';
import { AndamentoMes } from './AndamentoMes';
import { BarraPartes } from './BarraPartes';
import { BarrasHorizontais } from './BarrasHorizontais';
import { ContraMeta } from './ContraMeta';
import { CurvaAbc } from './CurvaAbc';
import { DestaquesCartao } from './DestaquesCartao';
import { Desvios } from './Desvios';
import { DoisLados } from './DoisLados';
import { DreCartao } from './DreCartao';
import { Faixas } from './Faixas';
import { Fatores } from './Fatores';
import { GraficosCartao } from './GraficosCartao';
import { Janelas } from './Janelas';
import { ListaDetalhe } from './ListaDetalhe';
import { Matriz } from './Matriz';
import { NumeroGrafico } from './NumeroGrafico';
import { TabelaCartao } from './TabelaCartao';

/** Desenha o cartão pelo `tipo` que veio da API. */
export function CartaoPainel({ cartao }: { cartao: Cartao }) {
  switch (cartao.tipo) {
    case 'andamento-mes':
      return <AndamentoMes cartao={cartao} />;
    case 'fatores':
      return <Fatores cartao={cartao} />;
    case 'contra-meta':
      return <ContraMeta cartao={cartao} />;
    case 'tabela':
      return <TabelaCartao cartao={cartao} />;
    case 'destaques':
      return <DestaquesCartao cartao={cartao} />;
    case 'graficos':
      return <GraficosCartao cartao={cartao} />;
    case 'faixas':
      return <Faixas cartao={cartao} />;
    case 'curva-abc':
      return <CurvaAbc cartao={cartao} />;
    case 'matriz':
      return <Matriz cartao={cartao} />;
    case 'dre':
      return <DreCartao cartao={cartao} />;
    case 'barra-partes':
      return <BarraPartes cartao={cartao} />;
    case 'desvios':
      return <Desvios cartao={cartao} />;
    case 'janelas':
      return <Janelas cartao={cartao} />;
    case 'dois-lados':
      return <DoisLados cartao={cartao} />;
    case 'barras-horizontais':
      return <BarrasHorizontais cartao={cartao} />;
    case 'numero-grafico':
      return <NumeroGrafico cartao={cartao} />;
    case 'lista-detalhe':
      return <ListaDetalhe cartao={cartao} />;
  }
}
