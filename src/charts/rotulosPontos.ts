// Posição dos nomes ao lado das bolhas da dispersão, sem um nome em cima de outro nem de uma bolha.

export interface Bolha {
  x: number;
  y: number;
  r: number;
}

/** Retângulo pelo canto de cima à esquerda. */
export interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RotuloPosto {
  /** índice da bolha */
  i: number;
  caixa: Caixa;
  /** traço da borda da bolha até o nome, quando ele fica longe dela */
  linha: [number, number, number, number] | null;
}

/** Altura da caixa de um nome em Poppins 11px. */
export const ALTURA_ROTULO = 13;
/** Largura aproximada de um nome em Poppins 11px (cerca de 6,2px por letra, como no eixo x). */
export const larguraDoNome = (nome: string) => nome.length * 6.2;

// distância da borda da bolha à caixa; a partir da segunda, o nome ganha o traço
const DISTANCIAS = [4, 14, 28, 44];
// direita, esquerda, diagonais, em cima e embaixo, nesta ordem de preferência
const DIRECOES: [number, number][] = [
  [1, 0],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, -1],
  [-1, 1],
  [0, -1],
  [0, 1],
];
const FOLGA = 2;

function caixaNaDirecao(b: Bolha, w: number, h: number, [dx, dy]: [number, number], d: number): Caixa {
  const diag = dx !== 0 && dy !== 0 ? Math.SQRT1_2 : 1;
  const ax = b.x + dx * (b.r + d) * diag;
  const ay = b.y + dy * (b.r + d) * diag;
  // a caixa fica do lado da direção: à direita começa em ax, à esquerda termina nele
  const x = dx > 0 ? ax : dx < 0 ? ax - w : ax - w / 2;
  const y = dy > 0 ? ay : dy < 0 ? ay - h : ay - h / 2;
  return { x, y, w, h };
}

const sobrepoe = (a: Caixa, b: Caixa) =>
  a.x < b.x + b.w + FOLGA && b.x < a.x + a.w + FOLGA && a.y < b.y + b.h + FOLGA && b.y < a.y + a.h + FOLGA;

function tocaBolha(c: Caixa, b: Bolha) {
  const px = Math.max(c.x, Math.min(b.x, c.x + c.w));
  const py = Math.max(c.y, Math.min(b.y, c.y + c.h));
  return (px - b.x) ** 2 + (py - b.y) ** 2 < (b.r + FOLGA) ** 2;
}

const dentro = (c: Caixa, area: Caixa) =>
  c.x >= area.x && c.y >= area.y && c.x + c.w <= area.x + area.w && c.y + c.h <= area.y + area.h;

/** Traço da borda da bolha até o ponto da caixa mais perto do centro dela. */
function traco(b: Bolha, c: Caixa): [number, number, number, number] {
  const px = Math.max(c.x, Math.min(b.x, c.x + c.w));
  const py = Math.max(c.y, Math.min(b.y, c.y + c.h));
  const d = Math.hypot(px - b.x, py - b.y) || 1;
  return [b.x + ((px - b.x) / d) * b.r, b.y + ((py - b.y) / d) * b.r, px, py];
}

/** Menor distância do centro da bolha ao segmento. */
function distanciaAoSegmento(b: Bolha, [x1, y1, x2, y2]: [number, number, number, number]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(b.x - (x1 + t * dx), b.y - (y1 + t * dy));
}

/** O segmento corta a caixa? Amostrado de 2 em 2px: basta para traços de até 50px. */
function cortaCaixa([x1, y1, x2, y2]: [number, number, number, number], c: Caixa) {
  const passos = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
  for (let k = 0; k <= passos; k++) {
    const x = x1 + ((x2 - x1) * k) / passos;
    const y = y1 + ((y2 - y1) * k) / passos;
    if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h) return true;
  }
  return false;
}

/**
 * Põe os nomes na ordem recebida (o mais importante primeiro): cada um vai para a primeira posição
 * livre ao redor da bolha, perto antes de longe, dentro da área e longe de outros nomes, de todas as
 * bolhas e dos `bloqueios` (os nomes dos quadrantes); o traço do nome afastado também não passa por
 * outra bolha nem por outro nome. Quem não acha lugar fica sem nome (a dica mostra).
 */
export function posicionarRotulos(
  nomes: { i: number; largura: number }[],
  bolhas: Bolha[],
  area: Caixa,
  bloqueios: Caixa[] = [],
): RotuloPosto[] {
  const postos: RotuloPosto[] = [];
  const ocupadas = [...bloqueios];
  for (const { i, largura } of nomes) {
    const b = bolhas[i];
    if (!b) continue;
    let achou: RotuloPosto | null = null;
    for (const [k, d] of DISTANCIAS.entries()) {
      for (const direcao of DIRECOES) {
        const c = caixaNaDirecao(b, largura, ALTURA_ROTULO, direcao, d);
        if (!dentro(c, area) || ocupadas.some((o) => sobrepoe(c, o)) || bolhas.some((x) => tocaBolha(c, x)))
          continue;
        const linha = k > 0 ? traco(b, c) : null;
        if (
          linha &&
          (bolhas.some((x, j) => j !== i && distanciaAoSegmento(x, linha) < x.r + 1) ||
            ocupadas.some((o) => cortaCaixa(linha, o)))
        )
          continue;
        achou = { i, caixa: c, linha };
        break;
      }
      if (achou) break;
    }
    if (achou) {
      postos.push(achou);
      ocupadas.push(achou.caixa);
    }
  }
  return postos;
}
