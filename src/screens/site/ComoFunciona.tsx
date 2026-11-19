import { CONTEUDO } from './conteudo';
import { TituloSecao } from './partes';
import './ComoFunciona.css';

export function ComoFunciona() {
  const c = CONTEUDO.como;
  return (
    <section id="como-funciona" className="s-sec" aria-labelledby="how-t">
      <div className="s-wrap">
        <TituloSecao id="how-t" sobretitulo={c.sobretitulo} titulo={c.titulo} />
        <ol className="s-passos">
          {c.passos.map(([titulo, texto]) => (
            <li key={titulo} className="s-rv">
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
        <p className="s-passos-nota s-rv">{c.nota}</p>
      </div>
    </section>
  );
}
