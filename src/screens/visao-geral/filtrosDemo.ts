import type { FiltroDef } from '../../components/BarraFiltros';

// TODO(filtros): "Comparar com" ainda não vai para a API; só o rótulo do chip muda.
// Período e Empresa já vêm de /api/sessao (ver filtros.ts).
export const FILTRO_COMPARAR: FiltroDef = {
  id: 'comparar',
  rotulo: 'Comparar com',
  opcoes: ['Orçado', 'Mês anterior', 'Meta comercial', 'Mesmo mês de 2025'],
  padrao: 'Orçado',
};
