import { NavLink } from 'react-router';
import { irAoTopo } from '../app/topo';
import { useAuth } from '../auth/auth';
import { ROTULO_TEMA } from '../theme/tema';
import { useTema } from '../theme/useTema';
import { Logotipo, Simbolo } from './Marca';
import './Rail.css';

// Traço dos ícones do menu (os do mockup).
const ICONE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Coluna de navegação grafite. Vira barra inferior no celular. */
export function Rail({ clienteSlug, dadosFicticios }: { clienteSlug: string; dadosFicticios: boolean }) {
  const { modo, alternar } = useTema();
  const { usuario, sair } = useAuth();
  return (
    <aside className="rail" aria-label="Navegação">
      <Logotipo className="logo" rotulo="Overnex, seu farol de decisões" />
      <Simbolo className="sym" rotulo="Overnex" />
      <nav
        className="nav"
        aria-label="Painéis"
        // Clicar na tela que já está aberta não troca de rota; aí só volta ao topo.
        onClick={(e) => {
          if ((e.target as Element).closest('a')?.getAttribute('aria-current') === 'page') irAoTopo();
        }}
      >
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
        <span className="ngroup">Comercial</span>
        <NavLink to={`/${clienteSlug}/vendas`} title="Vendas">
          <svg {...ICONE} aria-hidden="true">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </svg>
          <span>Vendas</span>
        </NavLink>
        <NavLink to={`/${clienteSlug}/equipe-comercial`} title="Equipe comercial">
          <svg {...ICONE} aria-hidden="true">
            <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />
          </svg>
          <span>Equipe comercial</span>
        </NavLink>
        <NavLink to={`/${clienteSlug}/clientes`} title="Clientes">
          <svg {...ICONE} aria-hidden="true">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
            <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
          </svg>
          <span>Clientes</span>
        </NavLink>
        <span className="ngroup">Financeiro</span>
        <NavLink to={`/${clienteSlug}/resultado`} title="Resultado">
          <svg {...ICONE} aria-hidden="true">
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          </svg>
          <span>Resultado</span>
        </NavLink>
        <NavLink to={`/${clienteSlug}/receber-pagar`} title="Receber e pagar">
          <svg {...ICONE} aria-hidden="true">
            <path d="M4 8h14l-3-3M20 16H6l3 3" />
          </svg>
          <span>Receber e pagar</span>
        </NavLink>
      </nav>
      <div className="rail-foot">
        {dadosFicticios && <span>Dados fictícios</span>}
        <button className="theme" type="button" onClick={alternar}>
          Tema: {ROTULO_TEMA[modo]}
        </button>
      </div>
      <div className="conta">
        {usuario && (
          <div className="conta-quem">
            <span className="conta-nome">{usuario.nome ?? usuario.email}</span>
            {usuario.nome && <span className="conta-email">{usuario.email}</span>}
          </div>
        )}
        <button className="sair" type="button" title="Sair" onClick={() => void sair()}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
            <path d="M10 8l-4 4 4 4" />
            <path d="M6 12h10" />
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
