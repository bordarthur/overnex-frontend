import { CONTEUDO } from './conteudo';
import { TituloSecao } from './partes';
import './Problema.css';

const ICONES = [
  <svg key="relatorio" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="5" y="7" width="30" height="26" rx="3" />
    <path d="M10 14h20M10 19h20M10 24h12M10 29h16" />
  </svg>,
  <svg key="sistemas" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="12" cy="20" r="6" />
    <circle cx="28" cy="20" r="6" />
    <path d="M12 14V7M28 26v7" />
  </svg>,
  <svg key="queda" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M5 10l10 9 7-6 13 15" />
    <path d="M27 28h8v-8" />
  </svg>,
];

export function Problema() {
  const p = CONTEUDO.problema;
  return (
    <section id="problema" className="s-sec" aria-labelledby="prob-t">
      <div className="s-wrap">
        <TituloSecao id="prob-t" sobretitulo={p.sobretitulo} titulo={p.titulo} />
        <p className="s-lede s-rv">{p.texto}</p>
        <ul className="s-prob-cols">
          {p.dores.map(([titulo, texto], i) => (
            <li key={titulo} className="s-rv">
              {ICONES[i]}
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
