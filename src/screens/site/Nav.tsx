import { useState } from 'react';
import { Link } from 'react-router';
import { Logotipo } from '../../components/Marca';
import { CONTEUDO } from './conteudo';
import { BotaoDemo } from './partes';
import { useRolou } from './useRevelar';
import './Nav.css';

/** Barra do topo: âncoras das seções, Entrar e a chamada; no celular, o menu abre uma folha. */
export function Nav() {
  const { nav } = CONTEUDO;
  const [aberto, setAberto] = useState(false);
  const rolou = useRolou();
  const classe = ['s-nav', rolou && 's-rolou', aberto && 's-aberto'].filter(Boolean).join(' ');

  return (
    <header className={classe} id="topo">
      <div className="s-wrap s-nav-in">
        <a className="s-nav-logo" href="#inicio" aria-label="Overnex, início">
          <Logotipo rotulo="Overnex, seu farol de decisões" />
        </a>
        <ul className="s-nav-links">
          {nav.links.map(([texto, href]) => (
            <li key={href}>
              <a href={href}>{texto}</a>
            </li>
          ))}
        </ul>
        <Link className="s-nav-entrar" to="/entrar">
          {nav.entrar}
        </Link>
        <BotaoDemo texto={CONTEUDO.chamadaCurta} />
        <button
          className="s-nav-menu"
          type="button"
          aria-expanded={aberto}
          aria-controls="s-nav-folha"
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setAberto(!aberto)}
        >
          <span />
        </button>
      </div>
      <div className="s-nav-folha" id="s-nav-folha">
        {nav.links.map(([texto, href]) => (
          <a key={href} href={href} onClick={() => setAberto(false)}>
            {texto}
          </a>
        ))}
        <Link to="/entrar">{nav.entrar}</Link>
      </div>
    </header>
  );
}

/** A chamada presa no pé da tela, só no celular. */
export function Dock() {
  return (
    <div className="s-dock">
      <BotaoDemo />
    </div>
  );
}
