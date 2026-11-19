import { useEffect, useState, type RefObject } from 'react';

/**
 * "Revelar ao rolar" do mockup: cada .s-rv dentro da raiz ganha .s-in quando entra na tela (uma vez).
 * Com movimento reduzido ou sem IntersectionObserver, tudo já aparece revelado.
 */
export function useRevelar(raiz: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const alvos = [...el.querySelectorAll('.s-rv')];
    const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduzido || typeof IntersectionObserver === 'undefined') {
      alvos.forEach((a) => a.classList.add('s-in'));
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('s-in');
          observador.unobserve(e.target);
        }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    alvos.forEach((a) => observador.observe(a));
    return () => observador.disconnect();
  }, [raiz]);
}

/** Se a página rolou (a barra do topo ganha a linha de baixo). */
export function useRolou(limite = 8) {
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ver = () => setRolou(window.scrollY > limite);
    ver();
    window.addEventListener('scroll', ver, { passive: true });
    return () => window.removeEventListener('scroll', ver);
  }, [limite]);
  return rolou;
}
