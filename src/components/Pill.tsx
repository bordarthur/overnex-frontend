import type { Status } from '../contracts/visaoGeral';
import { STATUS } from '../theme/status';
import './Pill.css';

/** Forma além da cor: círculo (saudável), triângulo (atenção), quadrado (crítico). */
export function IconeStatus({ status }: { status: Status }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      {status === 'saudavel' && <circle cx="5" cy="5" r="4.5" fill="currentColor" />}
      {status === 'atencao' && <path d="M5 .5L9.8 9.5H.2z" fill="currentColor" />}
      {status === 'critico' && <rect x=".8" y=".8" width="8.4" height="8.4" rx="1" fill="currentColor" />}
    </svg>
  );
}

export function Pill({ status }: { status: Status }) {
  return (
    <span className={`pill ${STATUS[status].classe}`}>
      <IconeStatus status={status} />
      {STATUS[status].rotulo}
    </span>
  );
}
