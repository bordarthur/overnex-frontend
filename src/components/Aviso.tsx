import type { Aviso as AvisoDados } from '../contracts/painel';
import { Trechos } from './Trechos';
import './Aviso.css';

/** Faixa de aviso no topo do painel (banner do mockup). */
export function Aviso({ aviso }: { aviso: AvisoDados }) {
  return (
    <div className={`banner ${aviso.tom === 'atencao' ? 'warn' : 'info'}`} role="note">
      <svg viewBox="0 0 10 10" aria-hidden="true">
        {aviso.tom === 'atencao' ? (
          <path d="M5 .5L9.8 9.5H.2z" fill="currentColor" />
        ) : (
          <circle cx="5" cy="5" r="4.5" fill="currentColor" />
        )}
      </svg>
      <div>
        <Trechos trechos={aviso.texto} />
      </div>
    </div>
  );
}
