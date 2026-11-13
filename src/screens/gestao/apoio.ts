import { useEffect } from 'react';
import { textoDaRecusa } from '../../api/client';
import type { OpcaoSessao, UsuarioGestao } from '../../contracts/gestao';
import { PERFIL_ADMIN } from '../../contracts/sessao';

/** Filtro da lista de pessoas quando a URL não diz qual (`?filtro=`). */
export const FILTRO_TODOS = 'todos';
/** Filtro "Convites pendentes": situação convite ou vencido. */
const FILTRO_PENDENTES = 'pendentes';
const SITUACOES_PENDENTES = ['convite', 'vencido'];

/**
 * A pessoa entra no filtro da lista? A API manda os filtros e os totais; a lista é filtrada aqui,
 * pelo `perfil.id` e pela `situacao.id` de cada pessoa.
 */
export function noFiltro(u: UsuarioGestao, filtro: string): boolean {
  if (filtro === FILTRO_TODOS) return true;
  if (filtro === FILTRO_PENDENTES) return SITUACOES_PENDENTES.includes(u.situacao.id);
  return u.perfil.id === filtro || u.situacao.id === filtro;
}

/** As opções de sessão que valem para o perfil: as marcadas `soAdmin`, só para o Admin BORD. */
export const sessoesDoPerfil = (sessoes: OpcaoSessao[], perfil: string) =>
  sessoes.filter((s) => !s.soAdmin || perfil === PERFIL_ADMIN);

/** Recusa de uma gravação da Gestão: o texto da API (regra quebrada) ou um genérico. */
export const erroDaGravacao = (erro: unknown) =>
  textoDaRecusa(erro, 'Não foi possível salvar. Tente de novo em instantes.');

/** Título da aba do navegador nas telas da Gestão. */
export function useTituloDaGestao(titulo: string) {
  useEffect(() => {
    document.title = `Overnex · Gestão · ${titulo}`;
  }, [titulo]);
}
