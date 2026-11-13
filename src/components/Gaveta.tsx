import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Gaveta.css';

interface PropsGaveta {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  /** Barra fixa embaixo, com as ações (Cancelar, Salvar). */
  rodape?: ReactNode;
}

const FOCAVEIS = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Gaveta lateral (role="dialog"), como o aviso de inatividade: o foco entra nela ao abrir, o Tab
 * fica preso dentro, Esc e o clique fora fecham, e o foco volta para quem abriu. Enquanto está
 * aberta, a página atrás não rola. Monte a gaveta só quando ela estiver aberta.
 */
export function Gaveta({ titulo, onFechar, children, rodape }: PropsGaveta) {
  const idTitulo = useId();
  const caixa = useRef<HTMLDivElement>(null);

  // O fechar mais recente, sem refazer os listeners a cada render do pai.
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    const antes = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // o primeiro campo que dá para editar; sem nenhum, o botão de fechar
    const campo = caixa.current?.querySelector<HTMLElement>(
      '.gaveta-corpo input:not(:disabled), .gaveta-corpo select:not(:disabled)',
    );
    (campo ?? caixa.current?.querySelector<HTMLElement>('button'))?.focus();

    // No documento, e não na gaveta: um botão que fica desabilitado enquanto grava perde o foco para
    // a página, e Esc e Tab precisam continuar valendo.
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return fechar.current();
      if (e.key !== 'Tab') return;
      const itens = Array.from(caixa.current?.querySelectorAll<HTMLElement>(FOCAVEIS) ?? []).filter(
        (el) => !el.matches(':disabled'),
      );
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (!primeiro || !ultimo) return;
      const dentro = caixa.current?.contains(document.activeElement);
      if (!dentro || (e.shiftKey && document.activeElement === primeiro)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primeiro).focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.style.overflow = rolagem;
      if (antes?.isConnected) antes.focus();
    };
  }, []);

  return createPortal(
    <div className="gaveta-fundo" onPointerDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div ref={caixa} className="gaveta" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <div className="gaveta-topo">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="gaveta-fechar" aria-label="Fechar" onClick={onFechar}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="gaveta-corpo">{children}</div>
        {rodape && <div className="gaveta-rodape">{rodape}</div>}
      </div>
    </div>,
    document.body,
  );
}
