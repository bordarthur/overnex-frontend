import { Outlet, useMatch } from 'react-router';
import { useAdiantarAoEntrar } from '../api/adiantar';
import { semPermissao, useApiClient } from '../api/client';
import { useClienteSlug } from '../api/useClienteSlug';
import { useSessao } from '../api/useSessao';
import { useAuth } from '../auth/auth';
import { EstadoTela } from '../components/EstadoTela';
import { MarcaDagua } from '../components/MarcaDagua';
import { Rail } from '../components/Rail';
import { CODIGO_DA_TELA, ehTelaApp } from '../contracts/telas';
import { TODAS_AS_TELAS } from './menu';
import { useTopoAoTrocarDeTela } from './topo';

const SEM_TELAS: string[] = [];

/**
 * Moldura comum às telas de uma empresa: rail, área principal e marca d'água da página.
 * A sessão da empresa (a do slug da URL) decide o menu e barra o que não é da pessoa: empresa que ela
 * não pode abrir (a API responde 403) e tela fora de `telas` mostram "sem acesso" no lugar da tela.
 */
export function Moldura() {
  const clienteSlug = useClienteSlug();
  const { dadosFicticios } = useApiClient();
  const { sair } = useAuth();
  const sessao = useSessao();
  const rota = useMatch('/:clienteSlug/:tela/*')?.params.tela;
  useTopoAoTrocarDeTela();

  const empresaNegada = sessao.isError && semPermissao(sessao.error);
  // Sessão fora do ar por outro motivo não derruba a navegação: o menu inteiro aparece, e a API barra.
  const telas = sessao.data?.telas ?? (sessao.isError && !empresaNegada ? TODAS_AS_TELAS : SEM_TELAS);
  const telaNegada = sessao.isSuccess && ehTelaApp(rota) && !telas.includes(CODIGO_DA_TELA[rota]);
  useAdiantarAoEntrar(clienteSlug, sessao.isSuccess && telas.includes(CODIGO_DA_TELA['visao-geral']));

  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <MarcaDagua variante="pagina" />
      <div className="app">
        <Rail
          clienteSlug={clienteSlug}
          dadosFicticios={dadosFicticios}
          telas={telas}
          clientes={sessao.data?.clientes ?? SEM_CLIENTES}
          gestao={sessao.data?.gestao ?? false}
        />
        <main className="main" id="conteudo" tabIndex={-1}>
          {empresaNegada || telaNegada ? (
            <EstadoTela tipo="sem-permissao" onSair={() => void sair()} />
          ) : (
            // key: trocar de empresa monta a tela de novo, sem os filtros (mês, CNPJ) da anterior
            <Outlet key={clienteSlug} />
          )}
        </main>
      </div>
    </>
  );
}

const SEM_CLIENTES: never[] = [];
