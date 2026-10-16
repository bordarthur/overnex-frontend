import { useLayoutEffect, useRef, useState } from 'react';

/** Largura do elemento, atualizada por ResizeObserver. Os gráficos desenham em pixels, como no mockup. */
export function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entradas) => {
      const w = Math.round(entradas[0]?.contentRect.width ?? 0);
      setLargura((atual) => (Math.abs(atual - w) < 2 ? atual : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, largura] as const;
}
