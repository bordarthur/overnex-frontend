import type { FiltroDef } from '../../components/BarraFiltros';

// TODO(filtros): as opções virão da API (períodos fechados, empresas do cliente) e o valor escolhido
// irá na consulta. Nesta entrega só o rótulo do chip muda; os números continuam os da fixture.
export const FILTROS_GLOBAIS: FiltroDef[] = [
  {
    id: 'periodo',
    rotulo: 'Período',
    opcoes: [
      'Outubro de 2026',
      'Setembro de 2026 (fechado)',
      'Acumulado de 2026',
      'Últimos 12 meses',
      'Personalizado…',
    ],
    padrao: 'Outubro de 2026',
  },
  {
    id: 'comparar',
    rotulo: 'Comparar com',
    opcoes: ['Orçado', 'Mês anterior', 'Meta comercial', 'Mesmo mês de 2025'],
    padrao: 'Orçado',
  },
  {
    id: 'empresa',
    rotulo: 'Empresa',
    opcoes: ['Todas (2)', 'Matriz Fortaleza', 'Filial Maracanaú'],
    padrao: 'Todas (2)',
  },
];

export const valoresPadrao = (): Record<string, string> =>
  Object.fromEntries(FILTROS_GLOBAIS.map((f) => [f.id, f.padrao]));
