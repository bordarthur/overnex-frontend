import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { useAdiantarAoEntrar } from '../api/adiantar';
import { semPermissao } from '../api/client';
import { useSessao } from '../api/useSessao';
import { useAuth } from '../auth/auth';
import { destinoSeguro } from '../auth/destino';
import { EstadoTela } from '../components/EstadoTela';

// Estados fora da moldura (sem rail): ao abrir o site e no redirecionamento de "/".
function TelaSolta({ children }: { children: ReactNode }) {
  return <main className="tela-solta">{children}</main>;
}

/** Só com sessão. Sem ela, vai para o login guardando a tela pedida (a não ser que a pessoa tenha clicado em Sair). */
export function RotaProtegida() {
  const { estado, saiu } = useAuth();
  const { pathname, search } = useLocation();
  useAdiantarAoEntrar();

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
  return <Outlet />;
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

/** "/": abre a Visão geral do cliente do usuário, que vem de /api/sessao. */
export function Inicio() {
  const sessao = useSessao();
  const { sair } = useAuth();

  if (sessao.isSuccess) return <Navigate to={`/${sessao.data.cliente.slug}/visao-geral`} replace />;
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
