import { CartaoInadimplencia } from '../../components/CartaoInadimplencia';
import { FaixaSecao } from '../../components/FaixaSecao';
import { IndicadorGauge } from '../../components/IndicadorGauge';
import { LinhaKpis } from '../../components/Kpi';
import type { PeriodoId, Secao } from '../../contracts/visaoGeral';
import { contarPorStatus } from './contagem';

/** Uma seção da Visão geral, desenhada só com o que veio no JSON. */
export function SecaoVisaoGeral({ secao, periodo }: { secao: Secao; periodo: PeriodoId }) {
  const idTitulo = `secao-${secao.id}`;
  return (
    <section className="vg-sec" aria-labelledby={idTitulo}>
      <FaixaSecao
        idTitulo={idTitulo}
        titulo={secao.titulo}
        modulo={secao.modulo}
        resumo={secao.resumo}
        contagem={contarPorStatus(secao.indicadores, periodo)}
      />
      {secao.kpis.length > 0 && <LinhaKpis kpis={secao.kpis} />}
      {secao.cartoes.map((c, i) =>
        c.tipo === 'inadimplencia' ? <CartaoInadimplencia key={`${c.tipo}-${i}`} cartao={c} /> : null,
      )}
      {secao.indicadores.length > 0 && (
        <div className="fgrid">
          {secao.indicadores.map((ind) => (
            <IndicadorGauge key={ind.id} indicador={ind} periodo={periodo} />
          ))}
        </div>
      )}
    </section>
  );
}
