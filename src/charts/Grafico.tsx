import type { Grafico as GraficoDados } from '../contracts/painel';
import { Barras } from './Barras';
import { Combo } from './Combo';
import { Degraus } from './Degraus';
import { Dispersao } from './Dispersao';
import { Empilhado } from './Empilhado';
import { Linhas } from './Linhas';

/** Desenha o gráfico pelo `tipo` que veio da API. */
export function Grafico({ grafico, aria }: { grafico: GraficoDados; aria: string }) {
  switch (grafico.tipo) {
    case 'barras':
      return <Barras grafico={grafico} aria={aria} />;
    case 'combo':
      return <Combo grafico={grafico} aria={aria} />;
    case 'linhas':
      return <Linhas grafico={grafico} aria={aria} />;
    case 'empilhado':
      return <Empilhado grafico={grafico} aria={aria} />;
    case 'dispersao':
      return <Dispersao grafico={grafico} aria={aria} />;
    case 'degraus':
      return <Degraus grafico={grafico} aria={aria} />;
  }
}
