import { ChamadaFinal } from './ChamadaFinal';
import { ComoFunciona } from './ComoFunciona';
import { Diferenciais } from './Diferenciais';
import { Faq } from './Faq';
import { FarolFuturo } from './FarolFuturo';
import { Hero } from './Hero';
import { LinguagemFarol } from './LinguagemFarol';
import { Dock, Nav } from './Nav';
import { PaginaSite } from './PaginaSite';
import { Problema } from './Problema';
import { QuemFaz } from './QuemFaz';
import { Rodape } from './Rodape';
import { Seguranca } from './Seguranca';
import { Setores } from './Setores';

/**
 * "/": o site institucional (mockup overnex-site-w2_0_0, W2.0.0), na ordem das seções do mockup.
 * Fica fora dos Providers do app (ver Raiz.tsx): não abre sessão nem chama a API.
 */
export default function Landing() {
  return (
    <PaginaSite titulo="Overnex · Seu farol de decisões" canonico="https://overnex.app/">
      <a className="s-pular" href="#conteudo">
        Ir para o conteúdo
      </a>
      <Nav />
      <main id="conteudo">
        <Hero />
        <Problema />
        <FarolFuturo />
        <ComoFunciona />
        <Setores />
        <LinguagemFarol />
        <Diferenciais />
        <Seguranca />
        <QuemFaz />
        <Faq />
        <ChamadaFinal />
      </main>
      <Rodape />
      <Dock />
    </PaginaSite>
  );
}
