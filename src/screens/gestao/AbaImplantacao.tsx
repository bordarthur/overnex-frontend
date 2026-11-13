import { Pill } from '../../components/Pill';
import type { CamadaDoCliente } from '../../contracts/gestao';

/**
 * Aba "Implantação": um cartão por camada, com o estado e o que falta para ela ficar ativa, como a
 * API mandar. A cor da borda vai pela ordem em que os grupos aparecem (o primeiro, o segundo...),
 * sem nome de grupo fixo aqui.
 */
export function AbaImplantacao({ camadas }: { camadas: CamadaDoCliente[] }) {
  const grupos = [...new Set(camadas.map((k) => k.grupo))];
  if (camadas.length === 0) return <p className="gst-vazio">Esta empresa ainda não tem camadas.</p>;

  return (
    <div className="gst-camadas">
      {camadas.map((k) => (
        <article
          key={k.id}
          className={`gst-camada grupo-${grupos.indexOf(k.grupo) % 3}`}
          aria-label={k.rotulo}
        >
          <h2>
            {k.rotulo}
            <span className="gst-etiqueta">{k.grupo}</span>
          </h2>
          <Pill status={k.status} rotulo={k.estadoRotulo} />
          {k.pendencias.length > 0 && (
            <ul className="gst-pendencias" aria-label={`Pendências de ${k.rotulo}`}>
              {k.pendencias.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
