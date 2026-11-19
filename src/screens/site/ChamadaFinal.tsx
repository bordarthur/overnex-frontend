import { CONTEUDO, linkEmail } from './conteudo';
import { BotaoDemo, SimboloSolto } from './partes';
import './ChamadaFinal.css';

export function ChamadaFinal() {
  const f = CONTEUDO.final;
  return (
    <section id="demonstracao" className="s-sec s-cta s-escuro" aria-labelledby="cta-t">
      <SimboloSolto className="s-cta-sym" />
      <div className="s-wrap s-cta-in">
        <h2 className="s-rv" id="cta-t">
          {f.titulo}
        </h2>
        <p className="s-rv">{f.sub}</p>
        <div className="s-cta-acoes s-rv">
          <BotaoDemo />
          <span className="s-cta-alt">
            {f.alternativa}{' '}
            <a className="s-lnk" href={linkEmail(CONTEUDO)}>
              {CONTEUDO.contato.email}
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
