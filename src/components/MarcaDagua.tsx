import { Logotipo, Simbolo } from './Marca';
import './MarcaDagua.css';

/**
 * Marca d'água da Overnex.
 * - pagina: símbolo grande, fixo no canto inferior direito, atrás do conteúdo.
 * - cartao: logotipo pequeno no canto inferior direito de um cartão (o cartão precisa de position: relative).
 */
export function MarcaDagua({ variante }: { variante: 'pagina' | 'cartao' }) {
  return variante === 'pagina' ? (
    <Simbolo className="wm" />
  ) : (
    <Logotipo className="wm-cartao" preserveAspectRatio="xMaxYMid meet" />
  );
}
