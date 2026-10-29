import './Segmentado.css';

interface PropsSegmentado<T extends string> {
  rotulo: string;
  opcoes: { id: T; rotulo: string }[];
  valor: T;
  onMudar: (id: T) => void;
  /** classe do grupo; `tseg` é a versão pequena, dentro do cartão */
  className?: string;
  desabilitado?: boolean;
}

/** Controle segmentado: um grupo de botões com aria-pressed, como o do mockup. */
export function Segmentado<T extends string>({
  rotulo,
  opcoes,
  valor,
  onMudar,
  className = 'seg',
  desabilitado = false,
}: PropsSegmentado<T>) {
  return (
    <div className={className} role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === valor}
          disabled={desabilitado}
          onClick={() => onMudar(o.id)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
