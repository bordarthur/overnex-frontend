import './Cabecalho.css';

interface PropsCabecalho {
  titulo: string;
  pergunta: string;
  /** "Dados até 12/10, atualizados hoje às 9h" */
  atualizacao?: string;
  cliente?: { nome: string; sigla: string; logoUrl: string | null };
}

export function Cabecalho({ titulo, pergunta, atualizacao, cliente }: PropsCabecalho) {
  return (
    <header className="top">
      <div>
        <div className="titlerow">
          <h1>{titulo}</h1>
        </div>
        <p className="q">{pergunta}</p>
      </div>
      <div className="controls">
        {atualizacao && (
          <span className="fresh">
            <i aria-hidden="true" />
            {atualizacao}
          </span>
        )}
        {cliente && (
          <div className="cobrand">
            {cliente.logoUrl ? (
              // TODO(co-branding): a CSP só aceita img-src 'self'; o logo do cliente precisa ser servido pela própria API.
              <img className="client-logo" src={cliente.logoUrl} alt="" />
            ) : (
              <span className="client" aria-hidden="true">
                {cliente.sigla}
              </span>
            )}
            <span className="client-name">{cliente.nome}</span>
          </div>
        )}
      </div>
    </header>
  );
}
