import type { GraficoDegraus } from '../contracts/painel';
import { LinhaDica, Tooltip } from '../components/Tooltip';
import { formatarEixo, formatarNaDica, useFoco } from './escala';
import { ticksRedondos } from './geometria';
import { useLargura } from './useLargura';
import './charts.css';

const CLASSE = { realizado: 'st-real', projecao: 'st-proj', meta: 'st-meta', supermeta: 'st-super' } as const;

interface Props {
  grafico: GraficoDegraus;
  aria: string;
  altura?: number;
}

/** Acumulado do mês em escadinha, com os dias sem venda sombreados (stepChart do mockup). */
export function Degraus(props: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      {largura > 0 && props.grafico.dias.length > 0 && <Desenho {...props} largura={largura} />}
    </div>
  );
}

function Desenho({ grafico, aria, altura = 420, largura }: Props & { largura: number }) {
  const { dias, series, hoje, falta } = grafico;
  const n = dias.length;
  const { foco, mover, sair } = useFoco(n, 'faixa');
  const eixo = formatarEixo(grafico);
  const naDica = formatarNaDica(grafico);

  const W = Math.max(300, largura);
  const estreito = W < 560;
  const H = altura;
  const P = { l: estreito ? 44 : 58, r: estreito ? 70 : 168, t: 22, b: 34 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const todos = series.flatMap((s) => s.valores.filter((v): v is number => v != null));
  let hi = Math.max(...todos, 0) * 1.05 || 1;
  const ticks = ticksRedondos(0, hi, 4);
  hi = Math.max(hi, ticks[ticks.length - 1] ?? hi);
  const cw = iw / n;
  const x0 = (i: number) => P.l + i * cw;
  const y = (v: number) => P.t + ih - (v / hi) * ih;

  // Cada valor vale do início ao fim do seu dia; a mudança acontece no meio do dia.
  const caminho = (valores: (number | null)[]) => {
    let d = '';
    let anterior: number | null = null;
    valores.forEach((v, i) => {
      if (v == null) return;
      const xa = x0(i);
      const xm = xa + cw / 2;
      const xb = x0(i + 1);
      if (anterior == null) d += `M${xa.toFixed(1)},${y(v).toFixed(1)}`;
      else if (v !== anterior)
        d += `L${xm.toFixed(1)},${y(anterior).toFixed(1)}L${xm.toFixed(1)},${y(v).toFixed(1)}`;
      d += `L${xb.toFixed(1)},${y(v).toFixed(1)}`;
      anterior = v;
    });
    return d;
  };

  const fins = series
    .map((s) => {
      let i = s.valores.length - 1;
      while (i > 0 && s.valores[i] == null) i--;
      const v = s.valores[i];
      const texto = estreito ? (s.rotuloFimCurto ?? s.rotuloFim) : s.rotuloFim;
      return texto && v != null
        ? { texto, x: x0(i + 1) + 8, y: y(v) + 4, principal: s.estilo === 'projecao' }
        : null;
    })
    .filter((f) => f != null)
    .sort((a, b) => a.y - b.y);
  fins.forEach((f, i) => {
    const anterior = fins[i - 1];
    if (anterior && f.y - anterior.y < 16) f.y = anterior.y + 16;
  });
  const diaFoco = foco ? dias[foco.i] : undefined;

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        {dias.map((d, i) =>
          d.util ? null : <rect key={i} className="nbd" x={x0(i)} y={P.t} width={cw} height={ih} />,
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line className="gl" x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} />
            <text className="ax" x={P.l - 8} y={y(t) + 4} textAnchor="end">
              {eixo(t)}
            </text>
          </g>
        ))}
        {dias.map((d, i) =>
          (estreito ? d.eixoCurto : d.eixo) ? (
            <text key={i} className="ax" x={x0(i) + cw / 2} y={H - 12} textAnchor="middle">
              {d.rotulo}
            </text>
          ) : null,
        )}
        {hoje && (
          <>
            <line
              className="today"
              x1={x0(hoje.indice + 1)}
              x2={x0(hoje.indice + 1)}
              y1={P.t}
              y2={P.t + ih}
            />
            <text className="todaylabel" x={x0(hoje.indice + 1) + 6} y={P.t + 10}>
              {hoje.rotulo}
            </text>
          </>
        )}
        {series.map((s) => (
          <path key={s.nome} className={CLASSE[s.estilo]} d={caminho(s.valores)} />
        ))}
        {fins.map((f) => (
          <text key={f.texto} className={`endlabel${f.principal ? ' main' : ''}`} x={f.x} y={f.y}>
            {f.texto}
          </text>
        ))}
        {falta && <line className="annl" x1={x0(n) - 2} x2={x0(n) - 2} y1={y(falta.de)} y2={y(falta.ate)} />}
        <rect
          className="ov"
          x={P.l}
          y={P.t}
          width={iw}
          height={ih}
          fill="transparent"
          onMouseMove={mover}
          onMouseLeave={sair}
        />
      </svg>
      <Tooltip aberto={diaFoco != null} x={foco?.x ?? 0} y={foco?.y ?? 0}>
        {diaFoco && foco && (
          <>
            <b>{diaFoco.titulo}</b>
            {[...series].reverse().map((s) => {
              const v = s.valores[foco.i];
              return v == null ? null : <LinhaDica key={s.nome} rotulo={s.nome} valor={naDica(v)} />;
            })}
          </>
        )}
      </Tooltip>
    </>
  );
}
