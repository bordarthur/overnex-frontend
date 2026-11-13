import { topoDoCaminho } from './geometria';

/** Um ponto marcado: onde ele está, o texto e a linha a que pertence (em pixels do desenho). */
export interface Marca {
  mx: number;
  my: number;
  texto: string;
  linha: [number, number][];
}

export interface RotuloMarca {
  x: number;
  y: number;
  ancora: 'start' | 'middle' | 'end';
}

// Poppins 12px em negrito: cerca de 7px por letra
const LETRA = 7;
// do ponto (ou da linha) até a linha de base do texto
const AFASTAMENTO = 12;
const ENTRELINHA = 15;
// folga entre dois rótulos lado a lado
const VAO = 6;

/**
 * Onde escrever o rótulo de cada ponto marcado: sempre acima da linha, ou seja, acima do ponto e do
 * trecho mais alto da linha por baixo do texto. Dois rótulos que se encostariam ficam um em cima
 * do outro. O `y` (linha de base) pode passar do topo do desenho: quem desenha abre espaço em cima.
 * `esquerda` e `largura`: onde começa a área do gráfico e a largura do desenho, para escolher o lado.
 */
export function colocarRotulos(marcas: Marca[], esquerda: number, largura: number): RotuloMarca[] {
  const caixas = marcas.map((m) => {
    const ancora = m.mx > largura - 140 ? 'end' : m.mx < esquerda + 60 ? 'start' : 'middle';
    const x = m.mx + (ancora === 'end' ? -8 : ancora === 'start' ? 8 : 0);
    const lt = m.texto.length * LETRA;
    const esq = ancora === 'end' ? x - lt : ancora === 'start' ? x : x - lt / 2;
    const topo = topoDoCaminho(m.linha, esq - 4, esq + lt + 4) ?? m.my;
    return { x, y: Math.min(m.my, topo) - AFASTAMENTO, ancora, esq, dir: esq + lt } as const;
  });

  // os mais baixos ficam onde estão; quem encosta em outro sobe uma linha
  const ys = caixas.map((c) => c.y);
  const postos: number[] = [];
  const ordem = caixas.map((_, i) => i).sort((a, b) => ys[b]! - ys[a]! || a - b);
  for (const i of ordem) {
    const c = caixas[i]!;
    let y = ys[i]!;
    for (let mexeu = true; mexeu;) {
      mexeu = false;
      for (const j of postos) {
        const p = caixas[j]!;
        if (c.esq < p.dir + VAO && p.esq < c.dir + VAO && Math.abs(y - ys[j]!) < ENTRELINHA) {
          y = ys[j]! - ENTRELINHA;
          mexeu = true;
        }
      }
    }
    ys[i] = y;
    postos.push(i);
  }
  return caixas.map((c, i) => ({ x: c.x, y: ys[i]!, ancora: c.ancora }));
}
