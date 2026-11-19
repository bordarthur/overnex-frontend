import { useEffect, useRef, type ReactNode } from 'react';
import { useRevelar } from './useRevelar';
import './PaginaSite.css';

interface PropsPaginaSite {
  titulo: string;
  /** endereço canônico da página, para os buscadores */
  canonico: string;
  children: ReactNode;
}

/** Raiz de cada página do site institucional: tema claro, título da aba e a revelação ao rolar. */
export function PaginaSite({ titulo, canonico, children }: PropsPaginaSite) {
  const raiz = useRef<HTMLDivElement>(null);
  useRevelar(raiz);
  useEffect(() => {
    document.title = titulo;
  }, [titulo]);

  return (
    <div className="s-site tema-claro" ref={raiz}>
      <link rel="canonical" href={canonico} />
      {children}
    </div>
  );
}
