import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import './CampoTexto.css';

interface PropsCampoTexto extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  ref?: Ref<HTMLInputElement>;
  rotulo: string;
  /** À direita do rótulo (ex.: o link "Esqueci a senha"). */
  acaoRotulo?: ReactNode;
  /** Abaixo do campo, ligado a ele por aria-describedby (ex.: aviso de Caps Lock, requisitos da senha). */
  dica?: ReactNode;
  /** Borda de erro. A mensagem fica na caixa de erro do formulário. */
  invalido?: boolean;
}

/** Campo com rótulo (mockup Login M2.0.0). Em type="password", tem o botão de mostrar a senha. */
export function CampoTexto({
  ref,
  rotulo,
  acaoRotulo,
  dica,
  invalido,
  type = 'text',
  ...resto
}: PropsCampoTexto) {
  const id = useId();
  const idDica = `${id}-dica`;
  const [mostrar, setMostrar] = useState(false);
  const senha = type === 'password';

  return (
    <div className="campo">
      <div className="campo-rotulo">
        <label htmlFor={id}>{rotulo}</label>
        {acaoRotulo}
      </div>
      <div className={invalido ? 'campo-caixa invalido' : 'campo-caixa'}>
        <input
          ref={ref}
          id={id}
          type={senha && mostrar ? 'text' : type}
          aria-invalid={invalido || undefined}
          aria-describedby={dica ? idDica : undefined}
          {...resto}
        />
        {senha && (
          <button
            type="button"
            className="campo-olho"
            aria-label="Mostrar senha"
            aria-pressed={mostrar}
            onClick={() => setMostrar((m) => !m)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {mostrar ? (
                <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.5 8 3 10 2 12c1 2.5 5 7 10 7 1.7 0 3.3-.5 4.6-1.3" />
              ) : (
                <>
                  <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {dica && (
        <div id={idDica} className="campo-dica">
          {dica}
        </div>
      )}
    </div>
  );
}
