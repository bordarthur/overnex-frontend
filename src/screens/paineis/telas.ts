import type { TelaPainel } from '../../contracts/painel';

/**
 * Rótulos de tela (título e pergunta do cabeçalho), como nos mockups Total M2.0.1 e M2.1.1. `comparar`: a tela
 * aceita o chip global "Comparar com" na consulta.
 */
export const TELAS_PAINEL: Record<TelaPainel, { titulo: string; pergunta: string; comparar?: boolean }> = {
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
  resultado: {
    titulo: 'Resultado',
    pergunta: 'Quanto sobra de cada real vendido e por que o resultado desviou?',
    comparar: true,
  },
  'receber-pagar': {
    titulo: 'Receber e pagar',
    pergunta: 'O que entra e o que sai nos próximos dias, quem cobrar e o que vence?',
  },
  pessoas: {
    titulo: 'Pessoas',
    pergunta: 'Quantas pessoas, quanto custam e quanto cada uma gera de receita?',
  },
};
