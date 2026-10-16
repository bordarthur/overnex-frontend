import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { criarMockClient, fixtureVisaoGeral } from '../api/mockClient';
import { App } from '../app/App';
import { Providers } from '../app/Providers';
import type { VisaoGeralPayload } from '../contracts/visaoGeral';

/** Renderiza o app inteiro numa rota, com o cliente mock sem atraso. */
export function renderizarApp(rota: string, payload: VisaoGeralPayload = fixtureVisaoGeral) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Providers apiClient={criarMockClient({ atrasoMs: 0, payload })} queryClient={queryClient}>
        <App />
      </Providers>
    </MemoryRouter>,
  );
}
