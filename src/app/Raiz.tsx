import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router';

// O site institucional fica em arquivos à parte, que o app não baixa (e vice-versa, quase: o React vem junto).
const Landing = lazy(() => import('../screens/site/Landing'));
const Privacidade = lazy(() => import('../screens/site/Privacidade'));

/**
 * O que abre em cada endereço do domínio:
 * - "/" e "/privacidade": o site institucional, fora dos Providers do app, sem sessão e sem chamada à
 *   API (quem só visita o site não acorda a API);
 * - o resto: o app (`app`, que já vem com os Providers), que entra por "/inicio" depois do login.
 */
export function Raiz({ app }: { app: ReactNode }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={null}>
            <Landing />
          </Suspense>
        }
      />
      <Route
        path="/privacidade"
        element={
          <Suspense fallback={null}>
            <Privacidade />
          </Suspense>
        }
      />
      <Route path="*" element={app} />
    </Routes>
  );
}
