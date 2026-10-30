import type { Grafico as GraficoDados } from '../contracts/painel';
import { Barras } from './Barras';
import { Cascata } from './Cascata';
import { Combo } from './Combo';
import { Degraus } from './Degraus';
import { Dispersao } from './Dispersao';
import { Empilhado } from './Empilhado';
import { Linhas } from './Linhas';

/** Desenha o gráfico pelo `tipo` que veio da API. */
export function Grafico({ grafico, aria, altura }: { grafico: GraficoDados; aria: string; altura?: number }) {
  switch (grafico.tipo) {
    case 'barras':
      return <Barras grafico={grafico} aria={aria} altura={altura} />;
    case 'combo':
      return <Combo grafico={grafico} aria={aria} altura={altura} />;
    case 'linhas':
      return <Linhas grafico={grafico} aria={aria} altura={altura} />;
    case 'empilhado':
      return <Empilhado grafico={grafico} aria={aria} altura={altura} />;
    case 'dispersao':
      return <Dispersao grafico={grafico} aria={aria} altura={altura} />;
    case 'degraus':
      return <Degraus grafico={grafico} aria={aria} altura={altura} />;
    case 'cascata':
      return <Cascata grafico={grafico} aria={aria} altura={altura} />;
  }
}
