import { Navigate, Route, Routes } from 'react-router';
import { VisaoGeralTela } from '../screens/visao-geral/VisaoGeralTela';
import { Moldura } from './Moldura';

const CLIENTE_PADRAO = import.meta.env.VITE_CLIENTE_PADRAO || 'demo';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${CLIENTE_PADRAO}/visao-geral`} replace />} />
      <Route path="/:clienteSlug" element={<Moldura />}>
        <Route index element={<Navigate to="visao-geral" replace />} />
        <Route path="visao-geral" element={<VisaoGeralTela />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
