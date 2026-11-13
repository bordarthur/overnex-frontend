import './CampoBusca.css';

interface PropsCampoBusca {
  /** O que a busca procura ("Buscar empresa"): vira o texto de exemplo e o nome para o leitor de tela. */
  rotulo: string;
  valor: string;
  onMudar: (valor: string) => void;
  /** `escura`: sobre o grafite da coluna lateral. */
  variante?: 'clara' | 'escura';
}

/** Campo de busca que filtra uma lista enquanto a pessoa digita. */
export function CampoBusca({ rotulo, valor, onMudar, variante = 'clara' }: PropsCampoBusca) {
  return (
    <input
      type="search"
      className={variante === 'escura' ? 'busca busca-escura' : 'busca'}
      placeholder={rotulo}
      aria-label={rotulo}
      value={valor}
      onChange={(e) => onMudar(e.target.value)}
    />
  );
}
