import { useId, useLayoutEffect, type CSSProperties } from 'react';
import { ticksRedondos } from '../charts/geometria';
import { useLargura } from '../charts/useLargura';
import type { CartaoProximosDias as Dados } from '../contracts/visaoGeral';
import { formatarRotulo, formatarValor } from '../format';
import { STATUS } from '../theme/status';
import { CabecalhoCartao } from './CabecalhoCartao';
import { MarcaDagua } from './MarcaDagua';
import { Segmentado } from './Segmentado';
import './CartaoProximosDias.css';

interface Props {
  cartao: Dados;
  /** id do modo escolhido (fica na seção, que conta o status do cartão na faixa) */
  modo: string;
  onModo: (id: string) => void;
}

/**
 * Uma linha por janela: em cima, o saldo de hoje (quando houver) e o que vence a receber; embaixo, o
 * que vence a pagar volta do fim da barra de cima e, no modo com falta, o que ainda falta lançar.
 * O traço marca onde a janela termina. As barras só empilham os valores; o fim vem pronto da API.
 */
export function CartaoProximosDias({ cartao, modo, onModo }: Props) {
  const idTitulo = useId();
  const [refGrade, largura] = useLargura<HTMLDivElement>();
  const { janelas, legenda, minimo } = cartao;
  const atual = cartao.modos.find((m) => m.id === modo) ?? cartao.modos[0];
  const comFalta = atual?.comFalta ?? false;
  const base = cartao.saldo?.valor ?? 0;

  // escala: do menor ponto com falta (ou zero) ao fim da barra de cima, em passos redondos
  const topos = janelas.map((j) => base + j.receber.valor);
  const pisos = janelas.map((j, i) => (topos[i] ?? 0) - j.pagar.valor - j.falta.valor);
  const lo0 = Math.min(0, ...pisos);
  const hi0 = Math.max(...topos, minimo?.valor ?? 0);
  const marcas = ticksRedondos(lo0, hi0, 5);
  const passo = marcas.length > 1 ? (marcas[1] ?? 0) - (marcas[0] ?? 0) : hi0 - lo0 || 1;
  const lo = Math.floor(lo0 / passo) * passo;
  const hi = Math.ceil(hi0 / passo) * passo || passo;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + passo / 1e6; t += passo) ticks.push(+t.toFixed(6));
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const trecho = (a: number, b: number): CSSProperties => ({
    left: `${x(Math.min(a, b))}%`,
    width: `${Math.abs(x(b) - x(a))}%`,
  });

  // valor dentro da barra só quando cabe
  useLayoutEffect(() => {
    refGrade.current?.querySelectorAll<HTMLElement>('.pj-b em').forEach((em) => {
      const barra = em.parentElement;
      em.style.visibility = barra && em.offsetWidth + 4 > barra.clientWidth ? 'hidden' : '';
    });
  }, [refGrade, largura, cartao, modo]);

  return (
    <article className={`card fin pj${comFalta ? ' m-falta' : ''}`} aria-labelledby={idTitulo}>
      <CabecalhoCartao
        idTitulo={idTitulo}
        titulo={cartao.titulo}
        subtitulo={cartao.subtitulo}
        status={atual?.status}
        explicacao={cartao.explicacao}
        // com um modo só (cliente sem pagamento nos meses fechados), não há o que trocar
        controle={
          cartao.modos.length > 1 && (
            <Segmentado
              rotulo="Contas a pagar consideradas"
              opcoes={cartao.modos}
              valor={modo}
              onMudar={onModo}
            />
          )
        }
      />
      <div className="pj-leg">
        {cartao.saldo && legenda.saldo && (
          <span>
            <i className="b-saldo" aria-hidden="true" />
            {legenda.saldo}
          </span>
        )}
        <span>
          <i className="b-rec" aria-hidden="true" />
          {legenda.receber}
        </span>
        <span>
          <i className="b-pag" aria-hidden="true" />
          {legenda.pagar}
        </span>
        <span className="lg-falta" aria-hidden={!comFalta}>
          <i className="b-falta" aria-hidden="true" />
          {legenda.falta}
        </span>
      </div>
      <div className="pj-grid" ref={refGrade}>
        <div className="pj-linhas">
          <div className="pj-ov" aria-hidden="true">
            {minimo && (
              <div className="pj-min" style={{ left: `${x(minimo.valor)}%` }}>
                <span>{minimo.rotulo}</span>
              </div>
            )}
            {lo < 0 && <div className="pj-zero" style={{ left: `${x(0)}%` }} />}
          </div>
          {janelas.map((j, i) => {
            const topo = topos[i] ?? 0;
            const fimLancado = topo - j.pagar.valor;
            const fim = j.fim[atual?.id ?? ''];
            const classe = fim?.status ? ` s-${STATUS[fim.status].classe}` : '';
            const partes = [
              cartao.saldo && legenda.saldo ? `${legenda.saldo} ${formatarValor(cartao.saldo)}` : null,
              `${legenda.receber} ${formatarValor(j.receber)}`,
              `${legenda.pagar} ${formatarValor(j.pagar)}`,
              comFalta ? `${legenda.falta} ${formatarValor(j.falta)}` : null,
            ].filter(Boolean);
            return (
              <div key={j.titulo} className="pj-row">
                <div className="pj-lab">
                  <b>{j.titulo}</b>
                  <span>{j.ate}</span>
                </div>
                <div className="pj-tr" role="img" aria-label={`${j.titulo}: ${partes.join(', ')}`}>
                  {cartao.saldo && (
                    <span
                      className="pj-b top b-saldo"
                      style={trecho(0, base)}
                      title={legenda.saldo ?? undefined}
                    >
                      <em>{formatarValor(cartao.saldo)}</em>
                    </span>
                  )}
                  <span
                    className={`pj-b top b-rec${cartao.saldo ? ' emenda' : ''}`}
                    style={trecho(base, topo)}
                    title={`${legenda.receber}: ${formatarValor(j.receber)}`}
                  >
                    <em>{formatarValor(j.receber)}</em>
                  </span>
                  <span
                    className="pj-b bot b-pag"
                    style={trecho(fimLancado, topo)}
                    title={`${legenda.pagar}: ${formatarValor(j.pagar)}`}
                  >
                    <em>{formatarValor(j.pagar)}</em>
                  </span>
                  <span
                    className="pj-b bot b-falta"
                    style={
                      comFalta
                        ? trecho(fimLancado - j.falta.valor, fimLancado)
                        : trecho(fimLancado, fimLancado)
                    }
                    title={`${legenda.falta}: ${formatarValor(j.falta)}`}
                  />
                  {fim && <i className={`pj-mk${classe}`} style={{ left: `${x(fim.valor.valor)}%` }} />}
                </div>
                {fim && (
                  <div className={`pj-end${classe}`}>
                    <b>{formatarValor(fim.valor)}</b>
                    <span>{fim.texto}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="pj-row pj-eixo" aria-hidden="true">
          <div className="pj-axis">
            {ticks.map((t, i) => (
              <span key={t} className={i % 2 ? 'odd' : undefined} style={{ left: `${x(t)}%` }}>
                {t === 0 ? '0' : formatarRotulo(t, 'brl', Number.isInteger(t / 1e6) ? 0 : 1)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="pj-note">{cartao.nota}</p>
      <MarcaDagua variante="cartao" />
    </article>
  );
}
