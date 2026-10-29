import { useState } from 'react';
import { useParams } from 'react-router';
import { CartaoInadimplencia } from '../../components/CartaoInadimplencia';
import { CartaoPagarLancado } from '../../components/CartaoPagarLancado';
import { CartaoProximosDias } from '../../components/CartaoProximosDias';
import { FaixaSecao } from '../../components/FaixaSecao';
import { IndicadorGauge } from '../../components/IndicadorGauge';
import { LinhaKpis } from '../../components/Kpi';
import type { CartaoSecao, PeriodoId, Secao, Status } from '../../contracts/visaoGeral';
import { TELAS_PAINEL } from '../paineis/telas';
import { contarPorStatus } from './contagem';
import { SeletorDaSecao } from './SeletorDaSecao';

interface Props {
  secao: Secao;
  /** a chave Mês/Acumulado de cada velocímetro; o primeiro é o padrão */
  periodos: { id: PeriodoId; rotulo: string }[];
  /** empresa escolhida na tela, para gravar a escolha do seletor */
  empresa?: string;
  /** o papel da sessão só pode ver a escolha do seletor */
  soLeitura: boolean;
}

const temTela = (tela: string): tela is keyof typeof TELAS_PAINEL => tela in TELAS_PAINEL;

/** Uma seção da Visão geral, desenhada só com o que veio no JSON. */
export function SecaoVisaoGeral({ secao, periodos, empresa, soLeitura }: Props) {
  const { clienteSlug } = useParams();
  const idTitulo = `secao-${secao.id}`;
  const padrao = periodos[0]?.id ?? 'mes';
  // cada velocímetro tem a própria chave, e o cartão de próximos dias o próprio modo
  const [periodoDe, setPeriodoDe] = useState<Record<string, PeriodoId>>({});
  const [modoDe, setModoDe] = useState<Record<number, string>>({});
  const periodoDo = (id: string) => periodoDe[id] ?? padrao;
  const modoDo = (i: number, modos: { id: string }[]) => modoDe[i] ?? modos[0]?.id ?? '';

  const statusDoCartao = (c: CartaoSecao, i: number): Status | null =>
    c.tipo === 'proximos-dias'
      ? (c.modos.find((m) => m.id === modoDo(i, c.modos))?.status ?? null)
      : c.status;
  const contagem = contarPorStatus([
    ...secao.indicadores.map((ind) => ind.periodos[periodoDo(ind.id)].status),
    ...secao.cartoes.map(statusDoCartao),
  ]);

  // Até 4 velocímetros por linha; com menos, eles dividem a largura toda.
  const colunas = Math.min(secao.indicadores.length, 4);
  return (
    <section className="vg-sec" aria-labelledby={idTitulo}>
      <FaixaSecao
        idTitulo={idTitulo}
        titulo={secao.titulo}
        modulo={secao.modulo}
        resumo={secao.resumo}
        contagem={contagem}
      />
      {secao.kpis.length > 0 && <LinhaKpis kpis={secao.kpis} />}
      {secao.seletor && <SeletorDaSecao seletor={secao.seletor} empresa={empresa} soLeitura={soLeitura} />}
      {secao.cartoes.map((c, i) => {
        const chave = `${c.tipo}-${i}`;
        if (c.tipo === 'inadimplencia') return <CartaoInadimplencia key={chave} cartao={c} />;
        if (c.tipo === 'pagar-lancado') return <CartaoPagarLancado key={chave} cartao={c} />;
        return (
          <CartaoProximosDias
            key={chave}
            cartao={c}
            modo={modoDo(i, c.modos)}
            onModo={(m) => setModoDe((atual) => ({ ...atual, [i]: m }))}
          />
        );
      })}
      {secao.indicadores.length > 0 && (
        <div className={`fgrid n-${colunas}`}>
          {secao.indicadores.map((ind) => (
            <IndicadorGauge
              key={ind.id}
              indicador={ind}
              periodos={periodos}
              periodo={periodoDo(ind.id)}
              onPeriodo={(p) => setPeriodoDe((atual) => ({ ...atual, [ind.id]: p }))}
              destino={
                clienteSlug && ind.telaDestino && temTela(ind.telaDestino)
                  ? `/${clienteSlug}/${ind.telaDestino}`
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
