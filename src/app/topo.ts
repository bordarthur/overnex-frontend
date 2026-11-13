import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

/** Leva a página ao topo, sem animação: a tela nova não pode aparecer no meio da rolagem da anterior. */
export function irAoTopo() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

/**
 * Ao trocar de tela, começa do topo. O modo declarativo do react-router não tem <ScrollRestoration>,
 * e a rolagem é a da janela (o rail fica fixo ao lado). Troca só de filtro (?…) não mexe na rolagem.
 * useLayoutEffect: rola antes de a tela nova ser pintada.
 */
export function useTopoAoTrocarDeTela() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    irAoTopo();
  }, [pathname]);
}
