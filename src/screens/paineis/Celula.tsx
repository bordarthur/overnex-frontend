import { Pill } from '../../components/Pill';
import type { Celula } from '../../contracts/painel';
import { formatarExibicao } from '../../format';

/** O que vai dentro de uma célula: seta, número formatado, etiqueta, pílula e a linha de baixo. */
export function ConteudoCelula({ celula: c }: { celula: Celula }) {
  const numero = c.valor != null && typeof c.valor !== 'string' ? c.valor.valor : null;
  const seta = c.seta && numero ? (numero > 0 ? '▲ ' : '▼ ') : '';
  return (
    <>
      {c.valor != null && (
        <>
          {seta}
          {formatarExibicao(c.valor, { comSinal: c.comSinal })}
        </>
      )}
      {c.etiqueta && <span className="tagn">{c.etiqueta}</span>}
      {c.pill && (typeof c.pill === 'string' ? <Pill status={c.pill} /> : <Pill {...c.pill} />)}
      {c.sub && <span className="r-sub cel-sub">{c.sub}</span>}
    </>
  );
}
