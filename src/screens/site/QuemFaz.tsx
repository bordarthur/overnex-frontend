import { CONTEUDO } from './conteudo';
import { TituloSecao } from './partes';
import './QuemFaz.css';

export function QuemFaz() {
  const q = CONTEUDO.quemFaz;
  // Enquanto os números da BORD não chegam (null), o bloco não aparece.
  const numeros = q.numeros.filter((n): n is [string, string] => n[0] != null);
  return (
    <section id="quem-faz" className="s-sec" aria-labelledby="qf-t">
      <div className="s-wrap">
        <div className={numeros.length ? 's-qf-grade' : 's-qf-grade s-qf-so-texto'}>
          <div>
            <TituloSecao id="qf-t" sobretitulo={q.sobretitulo} titulo={q.titulo} />
            <p className="s-lede s-rv">{q.texto}</p>
          </div>
          {numeros.length > 0 && (
            <ul className="s-qf-numeros">
              {numeros.map(([n, rotulo]) => (
                <li key={rotulo} className="s-rv">
                  <b>{n}</b>
                  <span>{rotulo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="s-qf-manifesto s-rv">
          {q.manifesto[0]} <em>{q.manifesto[1]}</em>
        </p>
      </div>
    </section>
  );
}
