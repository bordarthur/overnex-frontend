import { NavLink } from 'react-router';
import { ROTULO_TEMA } from '../theme/tema';
import { useTema } from '../theme/useTema';
import { Logotipo, Simbolo } from './Marca';
import './Rail.css';

/** Coluna de navegação grafite. Vira barra inferior no celular. */
export function Rail({ clienteSlug, dadosFicticios }: { clienteSlug: string; dadosFicticios: boolean }) {
  const { modo, alternar } = useTema();
  return (
    <aside className="rail" aria-label="Navegação">
      <Logotipo className="logo" rotulo="Overnex, seu farol de decisões" />
      <Simbolo className="sym" rotulo="Overnex" />
      <nav className="nav" aria-label="Painéis">
        <span className="ngroup">Visão</span>
        <NavLink to={`/${clienteSlug}/visao-geral`} title="Visão geral">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M15.5 8.5l-2 5-5 2 2-5z" />
          </svg>
          <span>Visão geral</span>
        </NavLink>
      </nav>
      <div className="rail-foot">
        {dadosFicticios && <span>Dados fictícios</span>}
        <button className="theme" type="button" onClick={alternar}>
          Tema: {ROTULO_TEMA[modo]}
        </button>
      </div>
    </aside>
  );
}
