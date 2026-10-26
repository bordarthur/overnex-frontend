import type { Cartao } from '../../contracts/painel';
import { AndamentoMes } from './AndamentoMes';
import { ContraMeta } from './ContraMeta';
import { CurvaAbc } from './CurvaAbc';
import { DestaquesCartao } from './DestaquesCartao';
import { Faixas } from './Faixas';
import { Fatores } from './Fatores';
import { GraficosCartao } from './GraficosCartao';
import { Matriz } from './Matriz';
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
  }
}
