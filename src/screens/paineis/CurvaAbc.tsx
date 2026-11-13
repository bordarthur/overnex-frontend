import { Linhas } from '../../charts/Linhas';
import { Trechos } from '../../components/Trechos';
import type { CartaoCurvaAbc } from '../../contracts/painel';
import { formatarExibicao } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './CurvaAbc.css';

/** Classes da curva ABC (o que fazer com cada uma) e a curva de Pareto ao lado. */
export function CurvaAbc({ cartao }: { cartao: CartaoCurvaAbc }) {
  return (
    <CaixaCartao cartao={cartao}>
      <div className="abcw">
        <div className="abcs">
          {cartao.classes.map((c) => (
            <div key={c.rotulo} className={`abc ${c.status ? STATUS[c.status].classe : 'neutro'}`}>
              <div className="abc-h">
                <b>{c.rotulo}</b>
                <span>{c.acao}</span>
              </div>
              <div className="abc-n">{formatarExibicao(c.quantidade)}</div>
              {c.textos.map((t, i) => (
                <div key={i} className="abc-s">
                  <Trechos trechos={t} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div>
          <Linhas grafico={cartao.grafico} aria={`${cartao.titulo}: curva de Pareto`} altura={220} />
          {cartao.notaGrafico && <p className="note abc-nota">{cartao.notaGrafico}</p>}
        </div>
      </div>
    </CaixaCartao>
  );
}
