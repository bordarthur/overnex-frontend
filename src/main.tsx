import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import { Providers } from './app/Providers';
import { aplicarTema, lerTemaSalvo } from './theme/tema';
import './theme/fonts';
import './theme/tokens.css';
import './app/base.css';

// Aplica o tema salvo antes do primeiro desenho, para não piscar o claro em quem escolheu o escuro.
aplicarTema(lerTemaSalvo());

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root não encontrado.');

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
);
