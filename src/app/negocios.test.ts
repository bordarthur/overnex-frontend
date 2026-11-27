import { describe, expect, it } from 'vitest';
import type { NegociosSessao } from '../contracts/negocios';
import { lerEscolha, paramDaEscolha, resumoDaEscolha, telaNosNegocios, unidadesDaArvore } from './negocios';

// o grupo do mockup M3.1.0: Distribuidora (Carnes, Materiais) e Varejo (Lupo, Usaflex)
const ARVORE: NegociosSessao = {
  setores: [
    {
      id: 'distribuidora',
      rotulo: 'Distribuidora',
      grupos: [
        { id: 'carnes', rotulo: 'Carnes', unidades: ['mtz', 'mrc'] },
        { id: 'matcon', rotulo: 'Materiais de construção', unidades: ['msj', 'eus'] },
      ],
    },
    {
      id: 'varejo',
      rotulo: 'Varejo',
      grupos: [
        { id: 'lupo', rotulo: 'Lupo', unidades: ['l1', 'l2', 'l3'] },
        { id: 'usaflex', rotulo: 'Usaflex', unidades: ['u1', 'u2'] },
      ],
    },
  ],
  telasPorSetor: { 'EST-01': ['distribuidora'] },
};
const TODAS = unidadesDaArvore(ARVORE);
const NOMES = new Map(TODAS.map((id) => [id, `Unidade ${id}`]));
const resumo = (ids: string[]) => resumoDaEscolha(ARVORE, new Set(ids), NOMES);

describe('escolha da bandeja Negócios', () => {
  it('sem parâmetro, ou só com ids de fora, marca todas', () => {
    expect(lerEscolha(null, TODAS)).toEqual(new Set(TODAS));
    expect(lerEscolha('xyz,abc', TODAS)).toEqual(new Set(TODAS));
    expect(lerEscolha('l1,xyz,u2', TODAS)).toEqual(new Set(['l1', 'u2']));
  });

  it('o parâmetro sai na ordem da bandeja, e nenhum com todas marcadas', () => {
    expect(paramDaEscolha(new Set(TODAS), TODAS)).toBeUndefined();
    expect(paramDaEscolha(new Set(['u2', 'mtz', 'l1']), TODAS)).toBe('mtz,l1,u2');
  });

  it('resume a escolha como no mockup', () => {
    expect(resumo(TODAS)).toBe('Tudo');
    expect(resumo(['l2'])).toBe('Unidade l2');
    // setor inteiro: o nome dele
    expect(resumo(['mtz', 'mrc', 'msj', 'eus'])).toBe('Distribuidora');
    // grupos inteiros de um setor cortado: os nomes, sem contagem
    expect(resumo(['mtz', 'mrc', 'l1', 'l2', 'l3'])).toBe('Carnes + Lupo');
    // um grupo só, ou um grupo cortado: com a contagem
    expect(resumo(['l1', 'l2', 'l3'])).toBe('Lupo · 3 unidades');
    expect(resumo(['mtz', 'mrc', 'msj', 'eus', 'l1'])).toBe('Distribuidora + Lupo · 5 unidades');
    expect(resumo(['mtz', 'msj', 'l1', 'u1'])).toBe('4 negócios · 4 unidades');
  });

  it('a tela de um setor some do menu sem unidade marcada dele', () => {
    expect(telaNosNegocios('EST-01', ARVORE, new Set(['mtz']))).toBe(true);
    expect(telaNosNegocios('EST-01', ARVORE, new Set(['l1', 'u1']))).toBe(false);
    // tela de todos os setores, ou cliente sem bandeja: sempre
    expect(telaNosNegocios('COM-01', ARVORE, new Set(['l1']))).toBe(true);
    expect(telaNosNegocios('EST-01', null, new Set())).toBe(true);
  });
});
