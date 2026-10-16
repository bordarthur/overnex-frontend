import { formatarDataHora } from '../format';
import { Logotipo } from './Marca';
import './Assinatura.css';

/** Rodapé de assinatura do painel. */
export function Assinatura({ atualizadoEm }: { atualizadoEm: string }) {
  return (
    <footer className="sig">
      <Logotipo />
      <span>
        Painel gerado pela Overnex com dados lidos do sistema do cliente, sem ajuste manual. Última carga:{' '}
        {formatarDataHora(atualizadoEm)}.
      </span>
    </footer>
  );
}
