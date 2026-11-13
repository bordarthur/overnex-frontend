import { useEffect } from 'react';
import { Link } from 'react-router';
import { Logotipo } from '../../components/Marca';
import type { ClienteSessao } from '../../contracts/sessao';
import './EscolhaEmpresa.css';

interface Props {
  /** As empresas que a pessoa pode abrir, como vieram de /api/sessao. */
  clientes: ClienteSessao[];
  onSair: () => void;
}

/** Depois de entrar, para quem abre mais de uma empresa: escolher qual. Depois, a troca é pelo menu. */
export function EscolhaEmpresa({ clientes, onSair }: Props) {
  useEffect(() => {
    document.title = 'Overnex · Escolha a empresa';
  }, []);

  return (
    <main className="escolha">
      <Logotipo className="escolha-logo" rotulo="Overnex, seu farol de decisões" />
      <h1>Escolha a empresa</h1>
      <p className="escolha-sub">Depois de abrir, dá para trocar de empresa pelo menu.</p>
      <ul className="escolha-lista">
        {clientes.map((c) => (
          <li key={c.slug}>
            <Link to={`/${c.slug}`}>
              <span className="client" aria-hidden="true">
                {c.sigla}
              </span>
              <span className="escolha-nome">{c.nome}</span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" className="link" onClick={onSair}>
        Sair
      </button>
    </main>
  );
}
