import { CONTEUDO } from './conteudo';
import { TituloSecao } from './partes';
import './Diferenciais.css';

export function Diferenciais() {
  const d = CONTEUDO.diferenciais;
  return (
    <section id="diferenciais" className="s-sec s-sem-topo" aria-labelledby="dif-t">
      <div className="s-wrap">
        <TituloSecao id="dif-t" sobretitulo={d.sobretitulo} titulo={d.titulo} />
        <p className="s-lede s-rv">{d.texto}</p>
        <div className="s-dif-grade s-rv">
          {d.itens.map(([titulo, texto], i) => (
            <div key={titulo}>
              <span>0{i + 1}</span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
