import { createContext, useContext } from 'react';
import type { FiltrosPainel } from '../../api/client';
import type { TelaPainel } from '../../contracts/painel';

/**
 * A tela e os filtros da consulta do painel, para o cartão que pede algo à parte com os mesmos
 * filtros (a tabela de nomes do "Mostrar nomes").
 */
export const ConsultaPainelContext = createContext<{ tela: TelaPainel; filtros: FiltrosPainel } | null>(null);

export const useConsultaPainel = () => useContext(ConsultaPainelContext);
