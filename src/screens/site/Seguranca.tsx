import { CONTEUDO } from './conteudo';
import { SimboloSolto, TituloSecao } from './partes';
import './Seguranca.css';

export function Seguranca() {
  const s = CONTEUDO.seguranca;
  return (
    <section id="seguranca" className="s-sec s-seg s-escuro" aria-labelledby="seg-t">
      <SimboloSolto className="s-seg-sym" />
      <div className="s-wrap">
        <TituloSecao id="seg-t" sobretitulo={s.sobretitulo} titulo={s.titulo} />
        <ul className="s-seg-lista">
          {s.itens.map((t) => (
            <li key={t} className="s-rv">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
