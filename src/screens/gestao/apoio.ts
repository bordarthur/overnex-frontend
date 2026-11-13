import { useEffect, useState } from 'react';
import { textoDaRecusa } from '../../api/client';
import type { GestaoPayload, OpcaoSessao, UsuarioGestao } from '../../contracts/gestao';
import { PERFIL_ADMIN } from '../../contracts/sessao';

/** Filtro da lista de pessoas quando a URL não diz qual (`?filtro=`). */
export const FILTRO_TODOS = 'todos';
/** Filtro "Convites pendentes": convite na fila, não enviado, enviado ou vencido. */
const FILTRO_PENDENTES = 'pendentes';
const SITUACOES_PENDENTES = ['fila', 'nao-enviado', 'convite', 'vencido'];

/**
 * Perfil, empresas e sessão do formulário de uma pessoa (edição e convite). As regras são da API; a
 * tela só as reflete: o perfil Admin BORD não tem lista de empresas, e trocar de perfil volta a sessão
 * para o padrão dele. `perfil` vazio e `sessaoMinutos` null: ainda não escolhidos (no convite).
 */
export function useCamposDeAcesso(
  gestao: GestaoPayload,
  inicial: { perfil: string; clientes: string[]; sessaoMinutos: number | null },
) {
  const [perfil, setPerfil] = useState(inicial.perfil);
  const [empresas, setEmpresas] = useState(() => new Set(inicial.clientes));
  const [sessao, setSessao] = useState(inicial.sessaoMinutos);

  return {
    perfil,
    sessao,
    setSessao,
    admin: perfil === PERFIL_ADMIN,
    empresas,
    /** as empresas marcadas, na ordem da lista */
    marcadas: gestao.clientes.filter((c) => empresas.has(c.slug)),
    trocarPerfil(novo: string) {
      setPerfil(novo);
      setSessao(gestao.perfis.find((p) => p.id === novo)?.sessaoPadraoMinutos ?? null);
      if (novo === PERFIL_ADMIN) setEmpresas(new Set());
    },
    marcarEmpresa(slug: string, marcada: boolean) {
      setEmpresas((atual) => {
        const novo = new Set(atual);
        if (marcada) novo.add(slug);
        else novo.delete(slug);
        return novo;
      });
    },
  };
}

export type CamposDeAcessoDoFormulario = ReturnType<typeof useCamposDeAcesso>;

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
