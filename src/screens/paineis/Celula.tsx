import { Pill } from '../../components/Pill';
import type { Celula } from '../../contracts/painel';
import { formatarExibicao, formatarRotulo } from '../../format';
import { LinkParaTela } from './LinkParaTela';
import './Bcg.css';
import './Estoque.css';

/**
 * O que vai dentro de uma célula: seta, número formatado, etiqueta, pílula, a Classe BCG, o atalho,
 * a linha de baixo e a barra pequena. Com `curto`, o número sai no formato dos eixos (6,64 mi, 26 d).
 */
export function ConteudoCelula({ celula: c, curto = false }: { celula: Celula; curto?: boolean }) {
  const numero = c.valor != null && typeof c.valor !== 'string' ? c.valor.valor : null;
  const seta = c.seta && numero ? (numero > 0 ? '▲ ' : '▼ ') : '';
  return (
    <>
      {c.marca && <span className="tag-marca">{c.marca}</span>}
      {c.quadrante && (
        <span className={`cel-quadrante q-${c.quadrante.id}`}>
          <i className="qd" aria-hidden="true" />
          {c.quadrante.rotulo}
        </span>
      )}
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
      {c.link && <LinkParaTela link={c.link} className="link cel-link" />}
      {c.sub && <span className="r-sub cel-sub">{c.sub}</span>}
      {c.barra && (
        <span className="cel-barra" aria-hidden="true">
          <i
            className={`ef-${c.barra.estilo}`}
            style={{ width: `${Math.max(0, Math.min(1, c.barra.proporcao)) * 100}%` }}
          />
        </span>
      )}
    </>
  );
}
