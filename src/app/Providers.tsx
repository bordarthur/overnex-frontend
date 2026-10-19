import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { ApiClientContext, type ApiClient } from '../api/client';
import { criarHttpClient } from '../api/httpClient';
import { criarMockClient } from '../api/mockClient';
import { useAuth } from '../auth/auth';
import { AuthProviderFake } from '../auth/AuthProviderFake';
import { TemaProvider } from '../theme/TemaProvider';

const atrasoMock = Number(import.meta.env.VITE_MOCK_ATRASO_MS ?? 300);
const usarApi = import.meta.env.VITE_API_MODO === 'api';

interface PropsProviders {
  children: ReactNode;
  /** Para testes: cliente de API e QueryClient próprios. */
  apiClient?: ApiClient;
  queryClient?: QueryClient;
}

export function Providers({ children, apiClient, queryClient }: PropsProviders) {
  const [qc] = useState(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <TemaProvider>
      <AuthProviderFake>
        <ApiProvider apiClient={apiClient}>
          <QueryClientProvider client={qc}>{children}</QueryClientProvider>
        </ApiProvider>
      </AuthProviderFake>
    </TemaProvider>
  );
}

// Fica dentro do AuthProvider porque o cliente HTTP pede o token a cada chamada.
function ApiProvider({ apiClient, children }: { apiClient?: ApiClient; children: ReactNode }) {
  const { getToken } = useAuth();
  const api = useMemo(
    () => apiClient ?? (usarApi ? criarHttpClient({ getToken }) : criarMockClient({ atrasoMs: atrasoMock })),
    [apiClient, getToken],
  );
  return <ApiClientContext.Provider value={api}>{children}</ApiClientContext.Provider>;
}
