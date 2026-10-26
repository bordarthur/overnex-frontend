import { useCallback, useEffect, useRef, useState } from 'react';

/** Contagem regressiva em segundos. `reiniciar(s)` começa de novo. */
export function useContagem(segundosIniciais: number) {
  const [restante, setRestante] = useState(segundosIniciais);
  // Um objeto novo a cada reinício, para o efeito rodar de novo mesmo com os mesmos segundos.
  const [rodada, setRodada] = useState({ segundos: segundosIniciais });

  useEffect(() => {
    if (rodada.segundos <= 0) return;
    const fim = Date.now() + rodada.segundos * 1000;
    const id = setInterval(() => {
      const falta = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
      setRestante(falta);
      if (falta === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [rodada]);

  const reiniciar = useCallback((segundos: number) => {
    setRestante(segundos);
    setRodada({ segundos });
  }, []);

  return { restante, reiniciar };
}

/** 900 → "15:00". */
export const minutosESegundos = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Sacode o formulário depois de um erro (o base.css desliga isso com movimento reduzido). */
export function useTremer<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const tremer = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('tremer');
    // Força o navegador a recalcular, para a animação rodar de novo.
    void el.offsetWidth;
    el.classList.add('tremer');
  }, []);
  return [ref, tremer] as const;
}

/** "Nuno Alvares" → "NA". */
export const iniciais = (texto: string) =>
  texto
    .split(/[\s@.]+/)
    .filter((p) => p.length > 0)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
