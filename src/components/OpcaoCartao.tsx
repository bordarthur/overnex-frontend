import './OpcaoCartao.css';

interface PropsOpcaoCartao {
  /** `radio`: uma só do grupo (precisa do `nome`); `checkbox`: várias. */
  tipo: 'radio' | 'checkbox';
  /** nome do grupo de rádios */
  nome?: string;
  titulo: string;
  descricao?: string;
  marcada: boolean;
  onMudar: (marcada: boolean) => void;
  desabilitada?: boolean;
}

/** Caixa de marcar ou botão de rádio em forma de cartão, com título e uma linha de explicação. */
export function OpcaoCartao({
  tipo,
  nome,
  titulo,
  descricao,
  marcada,
  onMudar,
  desabilitada = false,
}: PropsOpcaoCartao) {
  return (
    <label className="opcao-cartao">
      <input
        type={tipo}
        name={nome}
        checked={marcada}
        disabled={desabilitada}
        onChange={(e) => onMudar(e.target.checked)}
      />
      <span>
        <b>{titulo}</b>
        {descricao && <em>{descricao}</em>}
      </span>
    </label>
  );
}
