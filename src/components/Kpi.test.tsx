import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Kpi } from '../contracts/visaoGeral';
import { LinhaKpis } from './Kpi';

const kpis = (n: number): Kpi[] =>
  Array.from({ length: n }, (_, i) => ({
    rotulo: `KPI ${i + 1}`,
    valor: { valor: 13_876_873, unidade: 'brl', compacto: false },
    contexto: 'contexto',
  }));

const colunas = (n: number) => {
  const { container, unmount } = render(<LinhaKpis kpis={kpis(n)} />);
  const classe = container.querySelector('.kpis')?.className;
  unmount();
  return classe;
};

describe('LinhaKpis', () => {
  it('a quantidade que vem da API decide as linhas, como nos velocímetros', () => {
    // até 4, uma linha; 5 = 3 + 2, 6 = 3 + 3, 7 = 4 + 3, 8 = 4 + 4
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(colunas)).toEqual([
      'kpis n-1',
      'kpis n-2',
      'kpis n-3',
      'kpis n-4',
      'kpis n-3',
      'kpis n-3',
      'kpis n-4',
      'kpis n-4',
    ]);
  });

  it('o valor cheio vai inteiro, numa linha, com o tamanho do texto para a fonte se ajustar', () => {
    render(
      <LinhaKpis
        kpis={[
          { rotulo: 'Efeito', valor: { valor: -51_000, unidade: 'brl', compacto: false }, contexto: '' },
        ]}
      />,
    );
    const valor = screen.getByText('−R$ 51.000');
    expect(valor).toHaveClass('k-v', 'cabe');
    expect(valor.style.getPropertyValue('--car')).toBe('10');
  });
});
