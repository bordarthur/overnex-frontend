import type { StatusGestao } from '../contracts/gestao';
import type { Status } from '../contracts/visaoGeral';
import { STATUS } from '../theme/status';
import './Pill.css';

/** Forma além da cor: círculo (saudável), triângulo (atenção), quadrado (crítico) e anel vazado (neutro). */
export function IconeStatus({ status }: { status: StatusGestao }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      {status === 'saudavel' && <circle cx="5" cy="5" r="4.5" fill="currentColor" />}
      {status === 'atencao' && <path d="M5 .5L9.8 9.5H.2z" fill="currentColor" />}
      {status === 'critico' && <rect x=".8" y=".8" width="8.4" height="8.4" rx="1" fill="currentColor" />}
      {status === 'neutro' && (
        <circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      )}
    </svg>
  );
}

// O neutro não é um farol (não diz se está bom ou ruim), então não tem nome próprio: o texto vem sempre da API.
type PropsPill = { status: Status; rotulo?: string } | { status: 'neutro'; rotulo: string };

/**
 * Pílula de status. Com `rotulo`, mostra o texto que veio da API ("Alta") no lugar do nome do status.
 * A neutra (Desativado, desligada, indisponível) é cinza: cor de marca nunca indica status.
 */
export function Pill({ status, rotulo }: PropsPill) {
  const classe = status === 'neutro' ? 'neutro' : STATUS[status].classe;
  return (
    <span className={`pill ${classe}`}>
      <IconeStatus status={status} />
      {rotulo ?? (status === 'neutro' ? '' : STATUS[status].rotulo)}
    </span>
  );
}
