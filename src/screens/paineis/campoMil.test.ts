import { describe, expect, it } from 'vitest';
import { lerCampo, paraCampo } from './campoMil';

describe('campo em milhares das provisões', () => {
  it('mostra reais em milhares, sem separador de milhar', () => {
    expect(paraCampo(6400000)).toBe('6400');
    expect(paraCampo(630000)).toBe('630');
    expect(paraCampo(62500)).toBe('62,5');
    expect(paraCampo(0)).toBe('0');
  });

  it('lê o texto em milhares e devolve reais', () => {
    expect(lerCampo('800')).toBe(800000);
    expect(lerCampo(' 900,5 ')).toBe(900500);
    expect(lerCampo('1.5')).toBe(1500);
    expect(lerCampo('0')).toBe(0);
  });

  it('recusa o que não é número de zero para cima', () => {
    expect(lerCampo('')).toBeNull();
    expect(lerCampo('-5')).toBeNull();
    expect(lerCampo('mil')).toBeNull();
    expect(lerCampo('6.400,5')).toBeNull();
  });
});
