import './Chave.css';

interface Props {
  rotulo: string;
  ligada: boolean;
  onMudar: (ligada: boolean) => void;
  /** o rótulo fica só para o leitor de tela (a chave "Usar" das provisões) */
  ocultarRotulo?: boolean;
  desabilitada?: boolean;
}

/** Chave liga/desliga com o rótulo ao lado ("Mostrar nomes"). */
export function Chave({ rotulo, ligada, onMudar, ocultarRotulo = false, desabilitada = false }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={ocultarRotulo ? rotulo : undefined}
      className="chave"
      disabled={desabilitada}
      onClick={() => onMudar(!ligada)}
    >
      <span className="chave-trilho" aria-hidden="true">
        <span className="chave-bola" />
      </span>
      {!ocultarRotulo && rotulo}
    </button>
  );
}
