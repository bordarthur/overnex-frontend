import './Selecao.css';

interface PropsSelecao {
  /** nome do campo, para o leitor de tela */
  rotulo: string;
  opcoes: { id: string; rotulo: string }[];
  valor: string;
  onMudar: (id: string) => void;
  desabilitada?: boolean;
}

/** Lista suspensa pequena, para escolher dentro de uma linha de tabela. */
export function Selecao({ rotulo, opcoes, valor, onMudar, desabilitada = false }: PropsSelecao) {
  return (
    <select
      className="selecao"
      aria-label={rotulo}
      value={valor}
      disabled={desabilitada}
      onChange={(e) => onMudar(e.target.value)}
    >
      {opcoes.map((o) => (
        <option key={o.id} value={o.id}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}
