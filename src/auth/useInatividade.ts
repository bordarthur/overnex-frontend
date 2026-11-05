import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * O que conta como a pessoa usando a tela: clicar, tocar, digitar, rolar e mover o mouse.
 * Pedidos em segundo plano (renovar o token, adiantar meses) não passam por aqui, então não contam.
 * `scroll` fica de fora porque a própria tela rola sozinha ao trocar de rota.
 */
const EVENTOS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;

// As abas do Overnex no mesmo navegador dividem a atividade: usar uma mantém as outras abertas.
const CANAL = 'overnex-sessao';
// Avisa as outras abas no máximo uma vez a cada tanto, porque o mouse dispara dezenas de eventos por segundo.
const INTERVALO_AVISO_ABAS_MS = 5_000;

type MensagemCanal = { tipo: 'atividade'; em: number } | { tipo: 'venceu' };

interface OpcoesInatividade {
  /** Só conta com a sessão aberta. */
  ativo: boolean;
  limiteMs: number;
  /** Quanto antes do fim aparece o aviso. */
  avisoMs: number;
  onVencer: () => void;
}

/**
 * Encerra a sessão depois de `limiteMs` sem uso. Confere o relógio a cada segundo, em vez de um
 * setTimeout só, porque o navegador segura os timers de abas escondidas e para tudo quando o
 * computador dorme: quem volta depois de horas sai na hora.
 * Durante o aviso, só "Continuar conectado" conta: mexer o mouse não fecha o aviso sozinho.
 */
export function useInatividade({ ativo, limiteMs, avisoMs, onVencer }: OpcoesInatividade) {
  /** Segundos até o fim, quando o aviso está na tela. Senão, null. */
  const [restanteS, setRestanteS] = useState<number | null>(null);
  const ultima = useRef(0);
  const avisando = useRef(false);
  const canal = useRef<BroadcastChannel | null>(null);
  const ultimoAvisoAbas = useRef(0);
  const vencer = useRef(onVencer);
  useEffect(() => {
    vencer.current = onVencer;
  });

  const avisarAbas = useCallback((mensagem: MensagemCanal) => {
    canal.current?.postMessage(mensagem);
  }, []);

  const continuar = useCallback(() => {
    ultima.current = Date.now();
    ultimoAvisoAbas.current = ultima.current;
    avisando.current = false;
    setRestanteS(null);
    avisarAbas({ tipo: 'atividade', em: ultima.current });
  }, [avisarAbas]);

  useEffect(() => {
    if (!ativo) return;
    ultima.current = Date.now();
    avisando.current = false;
    canal.current = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CANAL);
    let encerrou = false;
    let ultimoPonteiro: { x: number; y: number } | null = null;

    function encerrar(avisar: boolean) {
      if (encerrou) return;
      encerrou = true;
      clearInterval(id);
      avisando.current = false;
      setRestanteS(null);
      if (avisar) avisarAbas({ tipo: 'venceu' });
      vencer.current();
    }

    function conferir() {
      const falta = limiteMs - (Date.now() - ultima.current);
      if (falta <= 0) return encerrar(true);
      avisando.current = falta <= avisoMs;
      setRestanteS(avisando.current ? Math.ceil(falta / 1000) : null);
    }

    function usou(evento: Event) {
      if (avisando.current) return;
      // Alguns navegadores disparam pointermove sem o mouse sair do lugar (quando a tela muda embaixo dele).
      if (evento instanceof MouseEvent && evento.type === 'pointermove') {
        const parado = ultimoPonteiro?.x === evento.clientX && ultimoPonteiro.y === evento.clientY;
        ultimoPonteiro = { x: evento.clientX, y: evento.clientY };
        if (parado) return;
      }
      const agora = Date.now();
      ultima.current = agora;
      if (agora - ultimoAvisoAbas.current >= INTERVALO_AVISO_ABAS_MS) {
        ultimoAvisoAbas.current = agora;
        avisarAbas({ tipo: 'atividade', em: agora });
      }
    }

    function recebeu({ data }: MessageEvent<MensagemCanal>) {
      if (data.tipo === 'venceu') return encerrar(false);
      // "Continuar conectado" em outra aba também fecha o aviso nesta.
      ultima.current = Math.max(ultima.current, data.em);
      conferir();
    }

    for (const tipo of EVENTOS) window.addEventListener(tipo, usou, { capture: true, passive: true });
    document.addEventListener('visibilitychange', conferir);
    canal.current?.addEventListener('message', recebeu);
    const id = setInterval(conferir, 1000);

    return () => {
      clearInterval(id);
      for (const tipo of EVENTOS) window.removeEventListener(tipo, usou, { capture: true });
      document.removeEventListener('visibilitychange', conferir);
      canal.current?.close();
      canal.current = null;
      avisando.current = false;
      setRestanteS(null);
    };
  }, [ativo, limiteMs, avisoMs, avisarAbas]);

  return { restanteS, continuar };
}
