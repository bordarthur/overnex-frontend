import type { ReactNode } from 'react';
import type { Status } from '../contracts/visaoGeral';
import { Explicacao } from './Explicacao';
import { Pill } from './Pill';

interface Props {
  idTitulo: string;
  titulo: string;
  subtitulo: string;
  status?: Status | null;
  explicacao?: string | null;
  /** controle no canto do cabeçalho (ex.: "Só o lançado" / "Com o que falta lançar") */
  controle?: ReactNode;
}

/** Cabeçalho dos cartões das seções da Visão geral: título, pílula, botão "i", subtítulo e controle. */
export function CabecalhoCartao({ idTitulo, titulo, subtitulo, status, explicacao, controle }: Props) {
  return (
    <div className="card-h">
      <div>
        <div className="card-titulo">
          <h2 id={idTitulo}>
            {titulo} {status && <Pill status={status} />}
          </h2>
          {explicacao && <Explicacao titulo={titulo} texto={explicacao} />}
        </div>
        <p className="sub">{subtitulo}</p>
      </div>
      {controle}
    </div>
  );
}
