import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiClientContext, type ApiClient } from '../api/client';
import { criarMockClient } from '../api/mockClient';
import { AuthProviderFake } from '../auth/AuthProviderFake';
import { TemaProvider } from '../theme/TemaProvider';

const atrasoMock = Number(import.meta.env.VITE_MOCK_ATRASO_MS ?? 300);

interface PropsProviders {
  children: ReactNode;
  /** Para testes: cliente de API e QueryClient próprios. */
  apiClient?: ApiClient;
  queryClient?: QueryClient;
}

export function Providers({ children, apiClient, queryClient }: PropsProviders) {
  // TODO(api): trocar o mock pelo cliente HTTP real (com token de useAuth) quando a API existir.
  const [api] = useState(() => apiClient ?? criarMockClient({ atrasoMs: atrasoMock }));
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
        <ApiClientContext.Provider value={api}>
          <QueryClientProvider client={qc}>{children}</QueryClientProvider>
        </ApiClientContext.Provider>
      </AuthProviderFake>
    </TemaProvider>
  );
}
