import { useSearchParams } from 'react-router';
import { useSessao } from '../api/useSessao';
import type { NegociosSessao, SetorNegocio } from '../contracts/negocios';
import type { Empresa } from '../contracts/sessao';

// A escolha da bandeja "Negócios": quais unidades estão marcadas. Fica na URL (`?unidades=`), para
// valer em todas as telas, sobreviver ao recarregar e ir junto num link. Sem o parâmetro, todas.
// Aqui só se guarda e se descreve a escolha; os números de cada unidade e o que cada painel soma
// vêm da API.

/** O parâmetro da URL das telas e da consulta à API. */
export const PARAM_UNIDADES = 'unidades';

export type Estado = 'on' | 'off' | 'mixed';

/** As unidades da árvore, na ordem da bandeja. */
export const unidadesDaArvore = (arvore: NegociosSessao) =>
  arvore.setores.flatMap((s) => s.grupos.flatMap((g) => g.unidades));

export const unidadesDoSetor = (s: SetorNegocio) => s.grupos.flatMap((g) => g.unidades);

export function estadoDe(ids: string[], marcadas: ReadonlySet<string>): Estado {
  const k = ids.filter((i) => marcadas.has(i)).length;
  return k === 0 ? 'off' : k === ids.length ? 'on' : 'mixed';
}

/** A escolha a partir do parâmetro da URL. Id que não é da árvore sai; sem nenhum válido, todas. */
export function lerEscolha(param: string | null, todas: string[]): Set<string> {
  const validas = new Set(todas);
  const ids = (param ?? '').split(',').filter((i) => validas.has(i));
  return new Set(ids.length > 0 ? ids : todas);
}

/** O parâmetro da escolha, na ordem da bandeja; com todas marcadas, nenhum. */
export function paramDaEscolha(marcadas: ReadonlySet<string>, todas: string[]): string | undefined {
  if (todas.every((i) => marcadas.has(i))) return undefined;
  return todas.filter((i) => marcadas.has(i)).join(',');
}

/** Os setores com alguma unidade marcada. */
export function setoresMarcados(arvore: NegociosSessao, marcadas: ReadonlySet<string>): Set<string> {
  return new Set(
    arvore.setores.filter((s) => unidadesDoSetor(s).some((i) => marcadas.has(i))).map((s) => s.id),
  );
}

/**
 * A tela aparece no menu? Só a de um setor (`telasPorSetor`) pode sumir: quando nenhuma unidade
 * marcada é de um dos setores dela. A API barra do mesmo jeito; aqui é só para o menu acompanhar a
 * bandeja sem pedir a sessão de novo.
 */
export function telaNosNegocios(
  codigo: string,
  arvore: NegociosSessao | null,
  marcadas: ReadonlySet<string>,
): boolean {
  const setores = arvore?.telasPorSetor[codigo];
  if (!arvore || !setores) return true;
  const marcados = setoresMarcados(arvore, marcadas);
  return setores.some((s) => marcados.has(s));
}

/**
 * O texto do botão "Negócios": "Tudo", o nome da unidade, os setores inteiros e os grupos marcados
 * ("Varejo", "Lupo + Usaflex"), com a contagem de unidades quando a escolha corta um grupo.
 */
export function resumoDaEscolha(
  arvore: NegociosSessao,
  marcadas: ReadonlySet<string>,
  nomes: ReadonlyMap<string, string>,
): string {
  const todas = unidadesDaArvore(arvore);
  if (todas.every((i) => marcadas.has(i))) return 'Tudo';
  const marcadasNaArvore = todas.filter((i) => marcadas.has(i));
  if (marcadasNaArvore.length === 1) return nomes.get(marcadasNaArvore[0]!) ?? '';

  // os setores inteiros pelo nome; dos outros, os grupos com alguma unidade marcada
  const partes: { rotulo: string; setor: boolean }[] = [];
  for (const s of arvore.setores) {
    const estado = estadoDe(unidadesDoSetor(s), marcadas);
    if (estado === 'on') partes.push({ rotulo: s.rotulo, setor: true });
    else if (estado === 'mixed')
      for (const g of s.grupos)
        if (estadoDe(g.unidades, marcadas) !== 'off') partes.push({ rotulo: g.rotulo, setor: false });
  }
  const grupoCortado = arvore.setores.some((s) =>
    s.grupos.some((g) => estadoDe(g.unidades, marcadas) === 'mixed'),
  );
  const soUmGrupo = partes.length === 1 && !partes[0]!.setor;
  let texto = partes.length <= 2 ? partes.map((p) => p.rotulo).join(' + ') : `${partes.length} negócios`;
  // a contagem só quando o nome não diz tudo: um grupo cortado, ou um grupo só
  if (grupoCortado || soUmGrupo) {
    const n = marcadasNaArvore.length;
    texto += ` · ${n} ${n === 1 ? 'unidade' : 'unidades'}`;
  }
  return texto;
}

export interface Negocios {
  arvore: NegociosSessao;
  nomes: ReadonlyMap<string, string>;
  marcadas: ReadonlySet<string>;
  /** o valor de `?unidades=` (undefined: todas) */
  param: string | undefined;
  /** grava a escolha na URL; vazia não grava (pelo menos uma unidade fica marcada) */
  mudar: (marcadas: ReadonlySet<string>) => boolean;
}

const SEM_UNIDADES: Empresa[] = [];

/**
 * A escolha de unidades da tela. Sem a bandeja (cliente com um negócio só, ou sessão ainda sem
 * resposta), `arvore` vem null e o chip "Unidade" faz o papel dela.
 */
export function useNegocios(): Negocios | { arvore: null; param: undefined } {
  const sessao = useSessao();
  const [params, setParams] = useSearchParams();
  const arvore = sessao.data?.negocios ?? null;
  const unidades = sessao.data?.empresas ?? SEM_UNIDADES;
  if (!arvore) return { arvore: null, param: undefined };
  const todas = unidadesDaArvore(arvore);
  const marcadas = lerEscolha(params.get(PARAM_UNIDADES), todas);
  return {
    arvore,
    nomes: new Map(unidades.map((u) => [u.id, u.nome])),
    marcadas,
    param: paramDaEscolha(marcadas, todas),
    mudar(novas) {
      if (!todas.some((i) => novas.has(i))) return false;
      const param = paramDaEscolha(novas, todas);
      setParams(
        (atual) => {
          const proximos = new URLSearchParams(atual);
          if (param) proximos.set(PARAM_UNIDADES, param);
          else proximos.delete(PARAM_UNIDADES);
          return proximos;
        },
        { replace: true },
      );
      return true;
    },
  };
}
