import { useContext, useSyncExternalStore } from 'react';
import { TemaContext, type ContextoTema } from './tema';

export function useTema(): ContextoTema {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>.');
  return ctx;
}

const CONSULTA_MOVIMENTO = '(prefers-reduced-motion: reduce)';

function assinarMovimento(aviso: () => void) {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia(CONSULTA_MOVIMENTO);
  mq.addEventListener('change', aviso);
  return () => mq.removeEventListener('change', aviso);
}

/** true quando o sistema pede menos movimento: ponteiro, entrada do painel e linha desenhando ficam sem animação. */
export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    assinarMovimento,
    () => typeof matchMedia === 'function' && matchMedia(CONSULTA_MOVIMENTO).matches,
    () => false,
  );
}
