import type { TelaPainel } from '../../contracts/painel';

/** Rótulos de tela (título e pergunta do cabeçalho), como no mockup Total M2.0.1. */
export const TELAS_COMERCIAIS: Record<TelaPainel, { titulo: string; pergunta: string }> = {
  vendas: {
    titulo: 'Vendas',
    pergunta: 'Vou bater a meta do mês? O que puxa para cima e o que puxa para baixo?',
  },
  'equipe-comercial': {
    titulo: 'Equipe comercial',
    pergunta: 'Quem está entregando, quem precisa de apoio e os novos estão evoluindo?',
  },
  clientes: {
    titulo: 'Clientes e atendimentos',
    pergunta: 'Quantos atendimentos, de quanto, em que dias e o que eles compram?',
  },
};
