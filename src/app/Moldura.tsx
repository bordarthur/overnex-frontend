import { Outlet, useParams } from 'react-router';
import { useApiClient } from '../api/client';
import { MarcaDagua } from '../components/MarcaDagua';
import { Rail } from '../components/Rail';
import { useTopoAoTrocarDeTela } from './topo';

/** Moldura comum às telas: rail, área principal e marca d'água da página. */
export function Moldura() {
  const { clienteSlug = '' } = useParams();
  const { dadosFicticios } = useApiClient();
  useTopoAoTrocarDeTela();
  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <MarcaDagua variante="pagina" />
      <div className="app">
        <Rail clienteSlug={clienteSlug} dadosFicticios={dadosFicticios} />
        <main className="main" id="conteudo" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
