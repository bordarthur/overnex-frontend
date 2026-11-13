import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { ApiClientContext, type ApiClient } from '../api/client';
import { criarHttpClient } from '../api/httpClient';
import { criarMockClient } from '../api/mockClient';
import { useAuth } from '../auth/auth';
import { criarAuthHttp, type AuthClient } from '../auth/authClient';
import { criarAuthFake } from '../auth/authFake';
import { personaDoToken } from '../auth/personasFake';
import { AuthProvider } from '../auth/AuthProvider';
import { TemaProvider } from '../theme/TemaProvider';

const atrasoMock = Number(import.meta.env.VITE_MOCK_ATRASO_MS ?? 300);
const usarApi = import.meta.env.VITE_API_MODO === 'api';
const usarAuthApi = import.meta.env.VITE_AUTH_MODO === 'api';
// Só para testar o aviso sem esperar; sem a variável, vale o tempo de sessão parada que a API manda.
const minutosInatividade = Number(import.meta.env.VITE_INATIVIDADE_MIN);
const limiteInatividadeMs = minutosInatividade > 0 ? minutosInatividade * 60_000 : undefined;

interface PropsProviders {
  children: ReactNode;
  /** Para testes: clientes de API e de autenticação e QueryClient próprios. */
  apiClient?: ApiClient;
  authClient?: AuthClient;
  queryClient?: QueryClient;
}

export function Providers({ children, apiClient, authClient, queryClient }: PropsProviders) {
  const [qc] = useState(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false } },
      }),
  );
  const [auth] = useState(
    () =>
      authClient ?? (usarAuthApi ? criarAuthHttp() : criarAuthFake({ lembrar: true, atrasoMs: atrasoMock })),
  );
  // O AuthProvider fica dentro do QueryClientProvider porque apaga o cache ao sair.
  return (
    <TemaProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider client={auth} limiteInatividadeMs={limiteInatividadeMs}>
          <ApiProvider apiClient={apiClient}>{children}</ApiProvider>
        </AuthProvider>
      </QueryClientProvider>
    </TemaProvider>
  );
}

// Fica dentro do AuthProvider porque o cliente HTTP pede o token a cada chamada.
function ApiProvider({ apiClient, children }: { apiClient?: ApiClient; children: ReactNode }) {
  const { getToken, renovarToken } = useAuth();
  const api = useMemo(
    () =>
      apiClient ??
      (usarApi
        ? criarHttpClient({ getToken, renovarToken })
        : criarMockClient({
            atrasoMs: atrasoMock,
            cenario: import.meta.env.VITE_MOCK_CENARIO,
            // no mock, a pessoa é a do token do login fake (dora@… é o Admin BORD)
            persona: async () => personaDoToken(await getToken()),
          })),
    [apiClient, getToken, renovarToken],
  );
  return <ApiClientContext.Provider value={api}>{children}</ApiClientContext.Provider>;
}
