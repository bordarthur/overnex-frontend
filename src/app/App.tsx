import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { EstadoTela } from '../components/EstadoTela';
import { DefinirSenhaTela } from '../screens/login/DefinirSenhaTela';
import { EsqueciSenhaTela } from '../screens/login/EsqueciSenhaTela';
import { LoginTela } from '../screens/login/LoginTela';
import { PainelTela } from '../screens/paineis/PainelTela';
import { VisaoGeralTela } from '../screens/visao-geral/VisaoGeralTela';
import { Inicio, InicioDaEmpresa, RotaProtegida, SoAnonimo, TelaSolta } from './Guardas';
import { Moldura } from './Moldura';

// A Gestão é só do Admin BORD: o código dela fica num arquivo à parte, que os clientes não baixam.
const Gestao = lazy(() => import('../screens/gestao/Gestao'));

const carregando = (
  <TelaSolta>
    <EstadoTela tipo="carregando" />
  </TelaSolta>
);

export function App() {
  return (
    <Routes>
      <Route element={<SoAnonimo />}>
        <Route path="/entrar" element={<LoginTela />} />
        <Route path="/esqueci-senha" element={<EsqueciSenhaTela />} />
      </Route>
      {/* Link do e-mail de convite ou de recuperação: vale com ou sem sessão aberta. */}
      <Route path="/definir-senha" element={<DefinirSenhaTela />} />
      <Route element={<RotaProtegida />}>
        <Route path="/" element={<Inicio />} />
        {/* Antes de "/:clienteSlug": "gestao" não é slug de empresa. */}
        <Route
          path="/gestao/*"
          element={
            <Suspense fallback={carregando}>
              <Gestao />
            </Suspense>
          }
        />
        <Route path="/:clienteSlug" element={<Moldura />}>
          <Route index element={<InicioDaEmpresa />} />
          <Route path="visao-geral" element={<VisaoGeralTela />} />
          {/* key: cada painel com os próprios filtros */}
          <Route path="vendas" element={<PainelTela key="vendas" tela="vendas" />} />
          <Route
            path="equipe-comercial"
            element={<PainelTela key="equipe-comercial" tela="equipe-comercial" />}
          />
          <Route path="clientes" element={<PainelTela key="clientes" tela="clientes" />} />
          <Route path="resultado" element={<PainelTela key="resultado" tela="resultado" />} />
          <Route path="receber-pagar" element={<PainelTela key="receber-pagar" tela="receber-pagar" />} />
          <Route path="fluxo-caixa" element={<PainelTela key="fluxo-caixa" tela="fluxo-caixa" />} />
          <Route path="pessoas" element={<PainelTela key="pessoas" tela="pessoas" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
