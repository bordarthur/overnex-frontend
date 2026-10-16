import './Segmentado.css';

interface PropsSegmentado<T extends string> {
  rotulo: string;
  opcoes: { id: T; rotulo: string }[];
  valor: T;
  onMudar: (id: T) => void;
}

/** Controle segmentado: um grupo de botões com aria-pressed, como o do mockup. */
export function Segmentado<T extends string>({ rotulo, opcoes, valor, onMudar }: PropsSegmentado<T>) {
  return (
    <div className="seg" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === valor} onClick={() => onMudar(o.id)}>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
