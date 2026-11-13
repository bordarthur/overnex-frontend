import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Explicacao.css';

interface Posicao {
  left: number;
  top: number;
}

/**
 * Botão "i" ao lado do título de um cartão, que abre a explicação do gráfico (infopop do mockup).
 * Fecha com Esc, com clique fora, ao rolar ou redimensionar; o foco fica no botão.
 */
export function Explicacao({ titulo, texto }: { titulo: string; texto: string }) {
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const id = useId();

  const abrir = () => {
    const r = botao.current?.getBoundingClientRect();
    if (!r) return;
    setPosicao({ left: Math.max(8, Math.min(r.left, window.innerWidth - 340)), top: r.bottom + 8 });
  };
  const aberto = posicao != null;

  useEffect(() => {
    if (!aberto) return;
    const abertoEm = performance.now();
    const fechar = () => setPosicao(null);
    const foraDela = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (!caixa.current?.contains(alvo) && !botao.current?.contains(alvo)) fechar();
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      fechar();
      botao.current?.focus();
    };
    // a rolagem que o próprio clique pode causar logo ao abrir não fecha a caixa
    const rolou = () => {
      if (performance.now() - abertoEm > 250) fechar();
    };
    document.addEventListener('pointerdown', foraDela);
    document.addEventListener('keydown', tecla);
    window.addEventListener('scroll', rolou, { passive: true });
    window.addEventListener('resize', fechar);
    return () => {
      document.removeEventListener('pointerdown', foraDela);
      document.removeEventListener('keydown', tecla);
      window.removeEventListener('scroll', rolou);
      window.removeEventListener('resize', fechar);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botao}
        type="button"
        className="ibtn"
        aria-label={`O que é o gráfico ${titulo}`}
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        onClick={() => (aberto ? setPosicao(null) : abrir())}
      >
        i
      </button>
      {posicao &&
        createPortal(
          <div
            ref={caixa}
            id={id}
            className="infopop"
            role="dialog"
            aria-label={titulo}
            style={{ left: posicao.left, top: posicao.top }}
          >
            <b>{titulo}</b>
            <p>{texto}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
