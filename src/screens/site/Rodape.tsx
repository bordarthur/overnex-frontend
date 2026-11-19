import { Link } from 'react-router';
import { Logotipo } from '../../components/Marca';
import { CONTEUDO, linkEmail, linkWhatsApp } from './conteudo';
import './Rodape.css';

export function Rodape() {
  const { rodape, contato } = CONTEUDO;
  return (
    <footer className="s-pe">
      <div className="s-wrap">
        <div className="s-pe-topo">
          <div className="s-pe-logo">
            <Logotipo rotulo="Overnex, seu farol de decisões" />
            <p>{rodape.assinatura}</p>
          </div>
          <nav aria-label="Rodapé">
            <ul>
              <li>
                <Link to="/privacidade">Privacidade</Link>
              </li>
              <li>
                <Link to="/entrar">Entrar</Link>
              </li>
              <li>
                <a href={linkWhatsApp(CONTEUDO)} target="_blank" rel="noopener noreferrer">
                  WhatsApp {contato.whatsappRotulo}
                </a>
              </li>
              <li>
                <a href={linkEmail(CONTEUDO)}>{contato.email}</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="s-pe-base">
          <span>{rodape.copy}</span>
          <span>{rodape.versao}</span>
        </div>
      </div>
    </footer>
  );
}
