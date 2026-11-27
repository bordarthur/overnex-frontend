import { Pill } from '../../components/Pill';
import type { CamadaDoCliente, Rotulado } from '../../contracts/gestao';
import { EtiquetaNivel } from './EtiquetaNivel';

/**
 * Aba "Implantação": um cartão por seção de painéis do menu (Comercial, Financeiro...), com o estado
 * da seção, os painéis dela, cada um com a etiqueta do nível ao lado, e o que falta para ela ficar
 * ativa, como a API mandar.
 */
export function AbaImplantacao({ camadas, niveis }: { camadas: CamadaDoCliente[]; niveis: Rotulado[] }) {
  if (camadas.length === 0) return <p className="gst-vazio">Esta empresa ainda não tem camadas.</p>;

  return (
    <div className="gst-camadas">
      {camadas.map((k) => (
        <article key={k.id} className="gst-camada" aria-label={k.rotulo}>
          <h2>
            {k.rotulo}
            <Pill status={k.status} rotulo={k.estadoRotulo} />
          </h2>
          <ul className="gst-camada-paineis" aria-label={`Painéis de ${k.rotulo}`}>
            {k.paineis.map((p) => (
              <li key={p.codigo}>
                <span>{p.nome}</span>
                <EtiquetaNivel nivel={p.nivel} niveis={niveis} />
              </li>
            ))}
          </ul>
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
