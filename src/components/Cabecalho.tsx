import { useId, useState, type ReactNode } from 'react';
import { resumoDaEscolha, useNegocios } from '../app/negocios';
import type { EscopoSetor } from '../contracts/negocios';
import { BandejaNegocios } from './negocios/BandejaNegocios';
import { BotaoNegocios } from './negocios/BotaoNegocios';
import './Cabecalho.css';

interface PropsCabecalho {
  titulo: string;
  pergunta: string;
  /** "Dados até 12/10, atualizados hoje às 9h" */
  atualizacao?: string;
  cliente?: { nome: string; sigla: string; logoUrl: string | null };
  /**
   * Telas da empresa: com mais de um negócio na sessão, o botão "Negócios" e a bandeja. `escopo`: o
   * painel só vale nestes setores; `mes`: o mês da tela, para os valores da bandeja.
   */
  negocios?: { escopo?: EscopoSetor | null; mes?: string };
}

export function Cabecalho({ negocios, ...props }: PropsCabecalho) {
  return negocios ? <ComNegocios {...props} negocios={negocios} /> : <Topo {...props} />;
}

function ComNegocios({
  negocios: opcoes,
  ...props
}: PropsCabecalho & Required<Pick<PropsCabecalho, 'negocios'>>) {
  const negocios = useNegocios();
  const id = useId();
  const [aberta, setAberta] = useState(false);
  if (!negocios.arvore) return <Topo {...props} />;
  return (
    <>
      <BandejaNegocios id={id} aberta={aberta} negocios={negocios} escopo={opcoes.escopo} mes={opcoes.mes} />
      <Topo
        {...props}
        botao={
          <BotaoNegocios
            controla={id}
            aberta={aberta}
            resumo={resumoDaEscolha(negocios.arvore, negocios.marcadas, negocios.nomes)}
            onClick={() => setAberta((a) => !a)}
          />
        }
      />
    </>
  );
}

function Topo({
  titulo,
  pergunta,
  atualizacao,
  cliente,
  botao,
}: Omit<PropsCabecalho, 'negocios'> & { botao?: ReactNode }) {
  const controles = (
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
  );
  return (
    <header className={botao ? 'top t31' : 'top'}>
      <div>
        <div className="titlerow">
          <h1>{titulo}</h1>
        </div>
        <p className="q">{pergunta}</p>
      </div>
      {botao ? (
        // o botão "Negócios" na linha do título, e o frescor e a empresa embaixo dele (mockup M3.1.0)
        <div className="t31-r">
          {botao}
          {controles}
        </div>
      ) : (
        controles
      )}
    </header>
  );
}
