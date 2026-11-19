import { CONTEUDO, linkWhatsApp } from './conteudo';

export function IconeWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.1-1.3c0-.1-.2-.2-.4-.3z" />
    </svg>
  );
}

/** "Agendar uma demonstração": abre a conversa no WhatsApp. */
export function BotaoDemo({ texto = CONTEUDO.chamada, neon = false }: { texto?: string; neon?: boolean }) {
  return (
    <a
      className={neon ? 's-btn s-neon' : 's-btn'}
      href={linkWhatsApp(CONTEUDO)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <IconeWhatsApp />
      {texto}
    </a>
  );
}

/**
 * O símbolo da marca, decorativo, na cor do `color` (as seções escuras o usam em branco ou em neon).
 * É o mesmo vetor de assets/overnex-simbolo.svg, que tem o neon fixo e por isso não serve aqui.
 */
export function SimboloSolto({ className }: { className: string }) {
  return (
    <svg className={`s-sym ${className}`} viewBox="424.80 461.09 363.95 161.57" aria-hidden="true">
      <path
        fill="currentColor"
        d="M 599.261719 553.429688 L 613.847656 553.429688 L 630.359375 620.652344 L 786.753906 616.605469 L 774.359375 571.488281 L 643.320312 580.195312 L 639.964844 567.976562 L 757.0625 508.515625 L 744.582031 463.085938 L 606.78125 544.589844 L 606.839844 545.15625 L 606.71875 545.164062 L 606.78125 544.589844 L 468.976562 463.085938 L 456.5 508.515625 L 573.59375 567.976562 L 570.238281 580.195312 L 439.199219 571.488281 L 426.804688 616.605469 L 583.132812 620.648438 Z M 599.261719 553.429688"
      />
    </svg>
  );
}

/** Sobretítulo e título de seção (o "eyebrow" e o .h2 do mockup). */
export function TituloSecao({
  id,
  sobretitulo,
  titulo,
}: {
  id: string;
  sobretitulo: string;
  titulo: string;
}) {
  return (
    <>
      <p className="s-sobre s-rv">{sobretitulo}</p>
      <h2 className="s-h2 s-rv" id={id}>
        {titulo}
      </h2>
    </>
  );
}
