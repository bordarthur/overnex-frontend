import type { Ref } from 'react';

interface PropsChip {
  rotulo: string;
  valor: string;
  /** valor diferente do padrão */
  ativo: boolean;
  aberto: boolean;
  idMenu: string;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

/** Chip de filtro que abre um menu suspenso. */
export function Chip({ rotulo, valor, ativo, aberto, idMenu, onClick, ref }: PropsChip) {
  return (
    <button
      ref={ref}
      type="button"
      className={`chip${ativo ? ' active' : ''}`}
      aria-haspopup="menu"
      aria-expanded={aberto}
      aria-controls={aberto ? idMenu : undefined}
      onClick={onClick}
    >
      <span className="k">{rotulo}</span>
      <span className="v">{valor}</span>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 6l4 4 4-4" />
      </svg>
    </button>
  );
}
