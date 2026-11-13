import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { semPermissao } from '../api/client';
import { useClienteSlug } from '../api/useClienteSlug';
import { useSessao } from '../api/useSessao';
import { useAuth } from '../auth/auth';
import { destinoSeguro } from '../auth/destino';
import { EstadoTela } from '../components/EstadoTela';
import { EscolhaEmpresa } from '../screens/entrada/EscolhaEmpresa';
import { AvisoInatividade } from './AvisoInatividade';
import { primeiraTela } from './menu';

// Estados fora da moldura (sem rail): ao abrir o site e no redirecionamento de "/".
export function TelaSolta({ children }: { children: ReactNode }) {
  return <main className="tela-solta">{children}</main>;
}

/** Só com sessão. Sem ela, vai para o login guardando a tela pedida (a não ser que a pessoa tenha clicado em Sair). */
export function RotaProtegida() {
  const { estado, saiu } = useAuth();
  const { pathname, search } = useLocation();

  if (estado === 'verificando')
    return (
      <TelaSolta>
        <EstadoTela tipo="carregando" />
      </TelaSolta>
    );
  if (estado === 'anonimo') {
    const voltar = !saiu && pathname !== '/' ? `?voltar=${encodeURIComponent(pathname + search)}` : '';
    return <Navigate to={`/entrar${voltar}`} replace />;
  }
  return (
    <>
      <Outlet />
      <AvisoInatividade />
    </>
  );
}

/** Login e "esqueci a senha": quem já entrou vai direto para a tela pedida. */
export function SoAnonimo() {
  const { estado } = useAuth();
  const [params] = useSearchParams();

  if (estado === 'verificando')
    return (
      <TelaSolta>
        <EstadoTela tipo="carregando" />
      </TelaSolta>
    );
  if (estado === 'autenticado') return <Navigate to={destinoSeguro(params.get('voltar'))} replace />;
  return <Outlet />;
}

/** A primeira tela liberada da empresa; sem nenhuma, a Visão geral (que mostra "sem acesso"). */
const telaDeEntrada = (slug: string, telas: string[]) => `/${slug}/${primeiraTela(telas) ?? 'visao-geral'}`;

/**
 * "/": para onde a pessoa vai ao entrar, pelo que /api/sessao (sem empresa escolhida) diz dela:
 * - Admin BORD: a Gestão;
 * - uma empresa só: a primeira tela dela (a Visão geral, quando liberada);
 * - duas ou mais: a tela "Escolha a empresa";
 * - nenhuma: o aviso que a API mandou e o botão Sair.
 */
export function Inicio() {
  const sessao = useSessao();
  const { sair } = useAuth();

  if (sessao.isSuccess) {
    const { gestao, cliente, clientes, telas, aviso } = sessao.data;
    if (gestao) return <Navigate to="/gestao" replace />;
    if (cliente) return <Navigate to={telaDeEntrada(cliente.slug, telas)} replace />;
    if (clientes.length > 0) return <EscolhaEmpresa clientes={clientes} onSair={() => void sair()} />;
    return (
      <TelaSolta>
        <EstadoTela tipo="vazio" texto={aviso ?? undefined} onSair={() => void sair()} />
      </TelaSolta>
    );
  }
  return (
    <TelaSolta>
      {sessao.isPending ? (
        <EstadoTela tipo="carregando" />
      ) : semPermissao(sessao.error) ? (
        <EstadoTela tipo="sem-permissao" onSair={() => void sair()} />
      ) : (
        <EstadoTela tipo="erro" onTentarDeNovo={() => void sessao.refetch()} />
      )}
    </TelaSolta>
  );
}

/** "/<empresa>": abre a primeira tela liberada da empresa (é para onde o seletor de empresa manda). */
export function InicioDaEmpresa() {
  const slug = useClienteSlug();
  const sessao = useSessao();

  if (sessao.isSuccess) return <Navigate to={telaDeEntrada(slug, sessao.data.telas)} replace />;
  if (sessao.isPending) return <EstadoTela tipo="carregando" />;
  // Sem a sessão, tenta a Visão geral: a própria tela mostra o erro ou a falta de acesso.
  return <Navigate to={`/${slug}/visao-geral`} replace />;
}
