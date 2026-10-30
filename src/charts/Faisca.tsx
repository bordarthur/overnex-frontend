import './charts.css';

/** Minigráfico da linha: realizado cheio, comparação tracejada (spark do mockup). */
export function Faisca({
  realizado,
  comparacao,
  w = 74,
  h = 22,
}: {
  realizado: number[];
  comparacao: number[];
  w?: number;
  h?: number;
}) {
  if (realizado.length < 2) return null;
  const todos = [...realizado, ...comparacao];
  const lo = Math.min(...todos);
  const sp = Math.max(...todos) - lo || 1;
  const pontos = (a: number[]) =>
    a.map((v, i) => [2 + (i * (w - 4)) / (a.length - 1), h - 3 - ((v - lo) / sp) * (h - 6)] as const);
  const caminho = (a: number[]) =>
    'M' +
    pontos(a)
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join('L');
  const ultimo = pontos(realizado)[realizado.length - 1];
  return (
    <svg className="faisca" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {comparacao.length > 1 && <path className="faisca-ref" d={caminho(comparacao)} />}
      <path d={caminho(realizado)} />
      {ultimo && <circle cx={ultimo[0]} cy={ultimo[1]} r={2.6} />}
    </svg>
  );
}
