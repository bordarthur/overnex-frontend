import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useAuth } from '../auth/auth';
import { minutosESegundos } from '../screens/login/apoio';
import './AvisoInatividade.css';

/**
 * Aviso que aparece pouco antes de a sessão cair por inatividade. Só "Continuar conectado"
 * (ou Esc) fecha: mexer o mouse por cima não conta, para ninguém fechar sem ver.
 */
export function AvisoInatividade() {
  const { avisoInatividade, continuarConectado, sair } = useAuth();
  const aberto = avisoInatividade !== null;
  const caixa = useRef<HTMLDivElement>(null);
  const continuar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const antes = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    continuar.current?.focus();
    return () => antes?.focus();
  }, [aberto]);

  if (!aberto) return null;

  // Prende o Tab dentro do aviso enquanto ele está aberto.
  function tecla(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') return continuarConectado();
    if (e.key !== 'Tab') return;
    const botoes = caixa.current?.querySelectorAll<HTMLButtonElement>('button');
    if (!botoes?.length) return;
    const primeiro = botoes[0]!;
    const ultimo = botoes[botoes.length - 1]!;
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  return (
    <div className="inatividade-fundo">
      <div
        ref={caixa}
        className="inatividade"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="inatividade-titulo"
        aria-describedby="inatividade-texto"
        onKeyDown={tecla}
      >
        <h2 id="inatividade-titulo">Você ainda está aí?</h2>
        <p id="inatividade-texto">Por segurança, a sessão termina depois de um tempo sem uso.</p>
        <p className="inatividade-tempo">
          Termina em <span className="inatividade-contagem">{minutosESegundos(avisoInatividade)}</span>
        </p>
        <div className="inatividade-acoes">
          <button ref={continuar} type="button" className="btn" onClick={continuarConectado}>
            Continuar conectado
          </button>
          <button type="button" className="link" onClick={() => void sair()}>
            Sair agora
          </button>
        </div>
      </div>
    </div>
  );
}
