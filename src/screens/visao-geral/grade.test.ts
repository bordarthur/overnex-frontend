import { describe, expect, it } from 'vitest';
import { colunasDaGrade } from './grade';

describe('colunasDaGrade', () => {
  it('até 4 velocímetros, uma linha só', () => {
    expect([1, 2, 3, 4].map(colunasDaGrade)).toEqual([1, 2, 3, 4]);
  });

  it('de 5 a 8, duas linhas com a de cima igual ou maior', () => {
    expect([5, 6, 7, 8].map(colunasDaGrade)).toEqual([3, 3, 4, 4]);
  });

  it('acima de 8, 4 por linha', () => {
    expect(colunasDaGrade(9)).toBe(4);
    expect(colunasDaGrade(12)).toBe(4);
  });
});
