import './Chave.css';

interface Props {
  rotulo: string;
  ligada: boolean;
  onMudar: (ligada: boolean) => void;
}

/** Chave liga/desliga com o rótulo ao lado ("Mostrar nomes"). */
export function Chave({ rotulo, ligada, onMudar }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      className="chave"
      onClick={() => onMudar(!ligada)}
    >
      <span className="chave-trilho" aria-hidden="true">
        <span className="chave-bola" />
      </span>
      {rotulo}
    </button>
  );
}
