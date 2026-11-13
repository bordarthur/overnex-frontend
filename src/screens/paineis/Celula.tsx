import { Pill } from '../../components/Pill';
import type { Celula } from '../../contracts/painel';
import { formatarExibicao, formatarRotulo } from '../../format';

/**
 * O que vai dentro de uma célula: seta, número formatado, etiqueta, pílula e a linha de baixo.
 * Com `curto`, o número sai no formato dos eixos (6,64 mi, 26 d).
 */
export function ConteudoCelula({ celula: c, curto = false }: { celula: Celula; curto?: boolean }) {
  const numero = c.valor != null && typeof c.valor !== 'string' ? c.valor.valor : null;
  const seta = c.seta && numero ? (numero > 0 ? '▲ ' : '▼ ') : '';
  return (
    <>
      {c.marca && <span className="tag-marca">{c.marca}</span>}
      {c.valor != null && (
        <>
          {seta}
          {curto && typeof c.valor !== 'string'
            ? formatarRotulo(c.valor.valor, c.valor.unidade, c.valor.casas)
            : formatarExibicao(c.valor, { comSinal: c.comSinal })}
        </>
      )}
      {c.etiqueta && (
        <span className={c.tomEtiqueta === 'vermelho' ? 'tagn vermelha' : 'tagn'}>{c.etiqueta}</span>
      )}
      {c.pill && (typeof c.pill === 'string' ? <Pill status={c.pill} /> : <Pill {...c.pill} />)}
      {c.sub && <span className="r-sub cel-sub">{c.sub}</span>}
    </>
  );
}
