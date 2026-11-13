import type { KeyboardEvent, ReactNode } from 'react';
import './Abas.css';

interface PropsAbas<T extends string> {
  /** nome do grupo de abas, para o leitor de tela */
  rotulo: string;
  /** prefixo dos ids, o mesmo do `PainelDaAba` */
  idBase: string;
  abas: { id: T; rotulo: string }[];
  ativa: T;
  onMudar: (id: T) => void;
}

const idDaAba = (idBase: string, id: string) => `${idBase}-aba-${id}`;
const idDoPainel = (idBase: string) => `${idBase}-painel`;

/**
 * Abas (role="tablist"). Só a aba ativa entra na ordem do Tab; as setas, Home e End andam entre
 * elas e já trocam o painel.
 */
export function Abas<T extends string>({ rotulo, idBase, abas, ativa, onMudar }: PropsAbas<T>) {
  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const atual = abas.findIndex((a) => a.id === ativa);
    const destino =
      e.key === 'ArrowRight'
        ? atual + 1
        : e.key === 'ArrowLeft'
          ? atual - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? abas.length - 1
              : null;
    if (destino === null) return;
    e.preventDefault();
    const aba = abas[(destino + abas.length) % abas.length];
    if (!aba) return;
    onMudar(aba.id);
    document.getElementById(idDaAba(idBase, aba.id))?.focus();
  };

  return (
    <div className="abas" role="tablist" aria-label={rotulo} onKeyDown={teclado}>
      {abas.map((a) => (
        <button
          key={a.id}
          type="button"
          role="tab"
          id={idDaAba(idBase, a.id)}
          aria-selected={a.id === ativa}
          aria-controls={idDoPainel(idBase)}
          tabIndex={a.id === ativa ? 0 : -1}
          onClick={() => onMudar(a.id)}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}

/** O conteúdo da aba ativa, ligado a ela pelo id. */
export function PainelDaAba({
  idBase,
  ativa,
  children,
}: {
  idBase: string;
  ativa: string;
  children: ReactNode;
}) {
  return (
    <div
      className="abas-painel"
      role="tabpanel"
      id={idDoPainel(idBase)}
      aria-labelledby={idDaAba(idBase, ativa)}
    >
      {children}
    </div>
  );
}
