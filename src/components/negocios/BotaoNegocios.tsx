import './Negocios.css';

interface Props {
  /** id da bandeja que o botão abre */
  controla: string;
  aberta: boolean;
  /** "Tudo", "Lupo + Usaflex", "Varejo · 3 unidades" */
  resumo: string;
  onClick: () => void;
}

/** Pílula "Negócios" na linha do título: mostra o que está marcado e abre a bandeja. */
export function BotaoNegocios({ controla, aberta, resumo, onClick }: Props) {
  return (
    <button
      type="button"
      className="negbtn"
      aria-expanded={aberta}
      aria-controls={controla}
      title={`Negócios: ${resumo}`}
      onClick={onClick}
    >
      <span className="nb-i" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3.5l8.5 4.3-8.5 4.3-8.5-4.3z" />
          <path d="M3.5 12.2l8.5 4.3 8.5-4.3" />
          <path d="M3.5 16.4l8.5 4.3 8.5-4.3" />
        </svg>
      </span>
      <span className="nb-t">{aberta ? 'Recolher' : 'Negócios'}</span>
      <span className="nb-s">{resumo}</span>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </button>
  );
}
