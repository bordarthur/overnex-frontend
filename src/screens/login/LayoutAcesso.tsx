import { useEffect, type ReactNode } from 'react';
import { Logotipo } from '../../components/Marca';
import { Feixe } from './Feixe';
import './Acesso.css';

type Marca = 'cadeado' | 'envelope' | 'relogio';

interface PropsLayoutAcesso {
  titulo: string;
  subtitulo?: ReactNode;
  /** Ícone acima do título, nas telas de aviso (acesso pausado, link enviado, link vencido). */
  marca?: Marca;
  children?: ReactNode;
}

/**
 * Moldura das telas de acesso (mockup Login M2.0.0): coluna grafite da marca à esquerda,
 * a tela à direita. No celular, a marca vira uma faixa no topo.
 */
export function LayoutAcesso({ titulo, subtitulo, marca, children }: PropsLayoutAcesso) {
  useEffect(() => {
    document.title = `Overnex · ${titulo}`;
  }, [titulo]);

  return (
    <div className="acesso">
      <aside className="acesso-marca" aria-label="Overnex">
        <Logotipo className="acesso-logo" rotulo="Overnex" />
        <Feixe />
        <div className="acesso-claim">
          <p className="acesso-claim-titulo">Os números de hoje já chegaram.</p>
          <p className="acesso-claim-texto">
            Vendas, resultado, caixa e equipe, atualizados todo dia às 9h. Entre para ver onde agir primeiro.
          </p>
        </div>
        <div className="acesso-rodape">
          <span>Um produto BORD</span>
          <span>overnex.app</span>
        </div>
      </aside>
      <main className="acesso-lado" id="conteudo">
        <div className="acesso-palco">
          <div className="acesso-tela" key={titulo}>
            {marca && <IconeMarca marca={marca} />}
            <h1>{titulo}</h1>
            {subtitulo && <p className="acesso-lead">{subtitulo}</p>}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function IconeMarca({ marca }: { marca: Marca }) {
  return (
    <div className={`acesso-icone ${marca === 'cadeado' ? 'aviso' : 'neutro'}`} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {marca === 'cadeado' && (
          <>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </>
        )}
        {marca === 'envelope' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3.5 6.5l8.5 6 8.5-6" />
          </>
        )}
        {marca === 'relogio' && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        )}
      </svg>
    </div>
  );
}
