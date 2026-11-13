import { useParams } from 'react-router';

/**
 * O slug da empresa escolhida: o `:clienteSlug` da URL. Vai em `?cliente=` de toda chamada de tela e
 * entra em toda query key; sem isso, trocar de empresa mostraria o cache da anterior.
 * Fora das rotas de cliente ("/" e a Gestão) vem vazio.
 */
export function useClienteSlug(): string {
  return useParams().clienteSlug ?? '';
}
