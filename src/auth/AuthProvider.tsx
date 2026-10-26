import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SessaoAuth, UsuarioAuth } from '../contracts/auth';
import { AuthContext, type Auth, type EstadoAuth } from './auth';
import type { AuthClient } from './authClient';

// Renova o token quando falta menos que isto para vencer.
const MARGEM_RENOVACAO_MS = 60_000;

/**
 * Sessão do usuário. O access token fica só na memória (num ref); ao recarregar a página,
 * a sessão volta pelo cookie httpOnly de refresh, que só a API lê.
 * Precisa estar dentro do QueryClientProvider: ao sair, o cache é apagado.
 */
export function AuthProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<EstadoAuth>('verificando');
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [saiu, setSaiu] = useState(false);
  const [sessaoEncerrada, setSessaoEncerrada] = useState<UsuarioAuth | null>(null);
  const sessao = useRef<SessaoAuth | null>(null);
  const renovando = useRef<Promise<string | null> | null>(null);

  const aplicar = useCallback(
    (nova: SessaoAuth | null) => {
      sessao.current = nova;
      setUsuario(nova?.usuario ?? null);
      setEstado(nova ? 'autenticado' : 'anonimo');
      setSessaoEncerrada(null);
      // Nada de um usuário pode sobrar no cache para o próximo.
      if (!nova) queryClient.clear();
    },
    [queryClient],
  );

  // Várias chamadas ao mesmo tempo dividem uma renovação só.
  const renovarToken = useCallback(() => {
    renovando.current ??= client
      .renovar()
      .then((nova) => {
        const antes = sessao.current?.usuario ?? null;
        aplicar(nova);
        // Caiu no meio do uso (não ao abrir o site): o login oferece continuar com a mesma conta.
        if (!nova && antes) setSessaoEncerrada(antes);
        return nova?.accessToken ?? null;
      })
      .finally(() => {
        renovando.current = null;
      });
    return renovando.current;
  }, [client, aplicar]);

  const getToken = useCallback(async () => {
    const atual = sessao.current;
    if (!atual) return null;
    if (Date.parse(atual.expiraEm) - Date.now() > MARGEM_RENOVACAO_MS) return atual.accessToken;
    return renovarToken();
  }, [renovarToken]);

  useEffect(() => {
    // Falha de rede ao abrir o site: segue como anônimo; o erro aparece se a pessoa tentar entrar.
    renovarToken().catch(() => aplicar(null));
  }, [renovarToken, aplicar]);

  const auth = useMemo<Auth>(
    () => ({
      estado,
      usuario,
      saiu,
      sessaoEncerrada,
      getToken,
      renovarToken,
      async entrar(email, senha) {
        aplicar(await client.entrar(email, senha));
        setSaiu(false);
      },
      async esqueciSenha(email) {
        await client.esqueciSenha(email);
      },
      async definirSenha(pedido) {
        aplicar(await client.definirSenha(pedido));
        setSaiu(false);
      },
      async sair() {
        try {
          await client.sair(sessao.current?.accessToken ?? null);
        } finally {
          // Mesmo se a API falhar, a sessão some deste navegador.
          setSaiu(true);
          aplicar(null);
        }
      },
    }),
    [estado, usuario, saiu, sessaoEncerrada, getToken, renovarToken, client, aplicar],
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
