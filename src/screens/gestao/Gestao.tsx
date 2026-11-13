import { Navigate, Route, Routes } from 'react-router';
import { EmpresaTela } from './EmpresaTela';
import { GestaoMoldura, PrimeiraEmpresa } from './GestaoMoldura';
import { UsuariosTela } from './UsuariosTela';

/**
 * Rotas da Gestão (Interno BORD), debaixo de "/gestao". Ficam num arquivo à parte do resto do app
 * (ver App.tsx): só o Admin BORD baixa este código.
 */
export default function Gestao() {
  return (
    <Routes>
      <Route element={<GestaoMoldura />}>
        <Route index element={<PrimeiraEmpresa />} />
        <Route path="empresas" element={<PrimeiraEmpresa />} />
        <Route path="empresas/:slug" element={<EmpresaTela />} />
        <Route path="usuarios" element={<UsuariosTela />} />
        <Route path="*" element={<Navigate to="/gestao" replace />} />
      </Route>
    </Routes>
  );
}
