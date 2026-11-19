import { Link } from 'react-router';
import { Logotipo } from '../../components/Marca';
import { CONTEUDO } from './conteudo';
import { PaginaSite } from './PaginaSite';
import './Privacidade.css';

/** "/privacidade": a política de privacidade (por enquanto, o aviso e o contato do mockup). */
export default function Privacidade() {
  const p = CONTEUDO.privacidade;
  const { email } = CONTEUDO.contato;
  return (
    <PaginaSite titulo="Overnex · Política de privacidade" canonico="https://overnex.app/privacidade">
      <header className="s-pag-topo">
        <Link to="/" aria-label="Overnex, página inicial">
          <Logotipo rotulo="Overnex" />
        </Link>
      </header>
      <main className="s-pag">
        <h1>{p.titulo}</h1>
        <p className="s-pag-lede">{p.lede}</p>
        <p>{p.texto}</p>
        <h2>{p.contatoTitulo}</h2>
        <p>
          {p.contatoTexto}{' '}
          <a className="s-lnk" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
        <p className="s-pag-voltar">
          <Link className="s-lnk" to="/">
            Voltar para o início
          </Link>
        </p>
      </main>
      <footer className="s-pag-pe">{p.rodape}</footer>
    </PaginaSite>
  );
}
