import { createContext, useContext } from 'react';
import type { FiltrosPainel } from '../../api/client';
import type { TelaPainel } from '../../contracts/painel';

/**
 * A empresa (o slug da URL), a tela e os filtros da consulta do painel, para o cartão que pede algo
 * à parte com os mesmos filtros (a tabela de nomes do "Mostrar nomes") ou que grava algo (as provisões).
 */
export const ConsultaPainelContext = createContext<{
  cliente: string;
  tela: TelaPainel;
  filtros: FiltrosPainel;
} | null>(null);

export const useConsultaPainel = () => useContext(ConsultaPainelContext);

/** Filtro da tela que aparece como chave no cabeçalho de um cartão (`cartao` em FiltroPainel). */
export interface ChaveDoCartao {
  rotulo: string;
  opcoes: { id: string; rotulo: string }[];
  // id da opção escolhida
  valor: string;
  onMudar: (id: string) => void;
}

/** As chaves dos cartões, por id do cartão. */
export const ChavesCartaoContext = createContext<Record<string, ChaveDoCartao>>({});

export const useChaveDoCartao = (cartao: string): ChaveDoCartao | undefined =>
  useContext(ChavesCartaoContext)[cartao];

/**
 * Troca um filtro da barra a partir de um cartão, pelo `id` do filtro e o `id` da opção (o "O que
 * fazer em cada quadrante" troca a Classe BCG). `null` volta à opção padrão; opção que o filtro não
 * tem é ignorada.
 */
export const MudarFiltroContext = createContext<(filtro: string, opcao: string | null) => void>(() => {});

export const useMudarFiltro = () => useContext(MudarFiltroContext);
