import { createContext } from 'react';

export type ModoTema = 'auto' | 'claro' | 'escuro';

export const ROTULO_TEMA: Record<ModoTema, string> = { auto: 'automático', claro: 'claro', escuro: 'escuro' };
const ORDEM: ModoTema[] = ['auto', 'claro', 'escuro'];
const CHAVE = 'overnex.tema';

export const proximoTema = (modo: ModoTema): ModoTema =>
  ORDEM[(ORDEM.indexOf(modo) + 1) % ORDEM.length] ?? 'auto';

/** Lê a escolha salva. Qualquer falha (modo privado, storage bloqueado) volta ao automático. */
export function lerTemaSalvo(): ModoTema {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === 'claro' || v === 'escuro' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function salvarTema(modo: ModoTema): void {
  try {
    if (modo === 'auto') localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, modo);
  } catch {
    // Sem storage, o tema vale só para esta visita.
  }
}

/** Automático segue o sistema (prefers-color-scheme); claro e escuro forçam via data-theme, como no mockup. */
export function aplicarTema(modo: ModoTema): void {
  const raiz = document.documentElement;
  if (modo === 'auto') raiz.removeAttribute('data-theme');
  else raiz.setAttribute('data-theme', modo === 'claro' ? 'light' : 'dark');
}

export interface ContextoTema {
  modo: ModoTema;
  alternar: () => void;
}

export const TemaContext = createContext<ContextoTema | null>(null);
