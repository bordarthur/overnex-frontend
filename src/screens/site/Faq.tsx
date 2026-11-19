import { CONTEUDO } from './conteudo';
import { TituloSecao } from './partes';
import './Faq.css';

export function Faq() {
  const f = CONTEUDO.faq;
  return (
    <section id="perguntas" className="s-sec s-faq" aria-labelledby="faq-t">
      <div className="s-wrap">
        <TituloSecao id="faq-t" sobretitulo={f.sobretitulo} titulo={f.titulo} />
        <div className="s-faq-lista s-rv">
          {f.itens
            .filter((i) => i.mostrar !== false)
            .map((i) => (
              <details key={i.pergunta}>
                <summary>{i.pergunta}</summary>
                <p>{i.resposta}</p>
              </details>
            ))}
        </div>
      </div>
    </section>
  );
}
