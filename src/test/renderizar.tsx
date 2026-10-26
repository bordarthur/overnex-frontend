import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { criarMockClient, fixtureVisaoGeral } from '../api/mockClient';
import type { ApiClient } from '../api/client';
import { App } from '../app/App';
import { Providers } from '../app/Providers';
import type { AuthClient } from '../auth/authClient';
import { criarAuthFake } from '../auth/authFake';
import type { VisaoGeralPayload } from '../contracts/visaoGeral';

/**
 * Renderiza o app inteiro numa rota, com o cliente mock sem atraso (ou o `apiClient` dado)
 * e, por padrão, com sessão aberta. Para testar o login, passe `criarAuthFake()` (sem sessão).
 */
export function renderizarApp(
  rota: string,
  payload: VisaoGeralPayload = fixtureVisaoGeral,
  apiClient: ApiClient = criarMockClient({ atrasoMs: 0, payload }),
  authClient: AuthClient = criarAuthFake({ logado: true }),
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tela = render(
    <MemoryRouter initialEntries={[rota]}>
      <Providers apiClient={apiClient} authClient={authClient} queryClient={queryClient}>
        <App />
      </Providers>
    </MemoryRouter>,
  );
  return { ...tela, queryClient };
}
