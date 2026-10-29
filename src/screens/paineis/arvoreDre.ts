import type { LinhaDre } from '../../contracts/painel';

// Árvore da DRE: só o que abrir e o que mostrar. Status e desvios vêm prontos da API.

export type Nivel = 1 | 2 | 3;

/** Linhas abertas para mostrar até o nível escolhido: as que têm filhos e ficam acima dele. */
export function abertasAteNivel(linhas: LinhaDre[], nivel: Nivel): Set<string> {
  const comFilhos = new Set(linhas.map((l) => l.pai).filter((p): p is string => p != null));
  return new Set(
    linhas.filter((l) => l.nivel >= 1 && l.nivel < nivel && comFilhos.has(l.id)).map((l) => l.id),
  );
}

/**
 * Linhas visíveis: subtotais sempre; as outras, se todas as de cima estiverem abertas. Com
 * "Só desvios", só as que a API marcou com desvio (nelas ou abaixo delas).
 */
export function linhasVisiveis(linhas: LinhaDre[], abertas: Set<string>, soDesvios: boolean): LinhaDre[] {
  const porId = new Map(linhas.map((l) => [l.id, l]));
  const caminhoAberto = (l: LinhaDre): boolean => {
    for (let pai = l.pai; pai != null; pai = porId.get(pai)?.pai) if (!abertas.has(pai)) return false;
    return true;
  };
  return linhas.filter((l) => l.nivel === 0 || (caminhoAberto(l) && (!soDesvios || l.comDesvio)));
}
