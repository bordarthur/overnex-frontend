import { Fragment } from 'react';
import type { Trecho } from '../contracts/visaoGeral';

/** Texto com destaques vindos da API, sem montar HTML. */
export function Trechos({ trechos }: { trechos: Trecho[] }) {
  return (
    <>
      {trechos.map((t, i) =>
        t.destaque ? <b key={i}>{t.texto}</b> : <Fragment key={i}>{t.texto}</Fragment>,
      )}
    </>
  );
}
