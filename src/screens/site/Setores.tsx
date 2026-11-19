import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Gauge } from '../../charts/Gauge';
import { Pill } from '../../components/Pill';
import type { Status } from '../../contracts/visaoGeral';
import { STATUS } from '../../theme/status';
import { CONTEUDO } from './conteudo';
import { VELOCIMETRO_VENDAS } from './farol';
import { TituloSecao } from './partes';
import './Setores.css';

type Tom = 'ok' | 'warn' | 'crit' | 'ink';

/** Barra horizontal com o valor e, se houver, a marca da referência (em % da largura). */
function Barra({
  rotulo,
  valor,
  pct,
  marca,
  tom,
}: {
  rotulo: string;
  valor: string;
  pct: number;
  marca?: number;
  tom: Tom;
}) {
  return (
    <div>
      <div className="s-barra-l">
        <span>{rotulo}</span>
        <span>{valor}</span>
      </div>
      <div className="s-barra-t">
        <i data-tom={tom} style={{ width: `${pct}%` }} />
        {marca != null && <em style={{ left: `${marca}%` }} />}
      </div>
    </div>
  );
}

function Linha({ status, nome, texto }: { status: Status; nome: string; texto: string }) {
  return (
    <div className="s-vg-linha">
      <i data-status={status} role="img" aria-label={STATUS[status].rotulo} />
      <b>{nome}</b>
      <span>{texto}</span>
    </div>
  );
}

function Topo({ titulo, lado }: { titulo: string; lado: ReactNode }) {
  return (
    <div className="s-mini-h">
      <span>{titulo}</span>
      {typeof lado === 'string' ? <span className="s-mini-lado">{lado}</span> : lado}
    </div>
  );
}

const Cadeado = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
);

/** Linha do custo mês a mês (Pessoas). */
function CustoMes({ valores }: { valores: number[] }) {
  const w = 320;
  const h = 120;
  const meses = ['jun', 'jul', 'ago', 'set', 'out', 'nov'];
  const lo = Math.min(...valores) * 0.96;
  const hi = Math.max(...valores) * 1.02;
  const X = (i: number) => 10 + (i * (w - 60)) / (valores.length - 1);
  const Y = (v: number) => 10 + (h - 34) - ((v - lo) / (hi - lo)) * (h - 34);
  return (
    <svg className="s-custo" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline className="s-spk-l" points={valores.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
      {valores.map((v, i) => (
        <g key={meses[i]}>
          <circle cx={X(i)} cy={Y(v)} r={i === valores.length - 1 ? 4.5 : 2.5} />
          <text className="s-spk-t" x={X(i)} y={h - 4} textAnchor="middle">
            {meses[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** O exemplo de cada aba, com números ilustrativos do Cliente Demo (como no mockup). */
const EXEMPLOS: Record<string, () => ReactNode> = {
  geral: () => (
    <>
      <Topo titulo="Visão geral · hoje" lado="Cliente Demo" />
      <Linha status="critico" nome="Financeiro" texto="Contas a pagar acima do que vai entrar em 30 dias" />
      <Linha status="atencao" nome="Vendas" texto="Projeção 5,2% abaixo da meta do mês" />
      <Linha status="atencao" nome="Resultado" texto="Margem abaixo do orçado no mês" />
      <Linha status="saudavel" nome="Custos" texto="Dentro do orçado" />
      <Linha status="saudavel" nome="Estoque" texto="Cobertura saudável" />
    </>
  ),
  comercial: () => (
    <>
      <Topo titulo="Vendas contra a meta" lado={<Pill status="atencao" />} />
      <Gauge {...VELOCIMETRO_VENDAS} unidade="pct" ponteiro={94.8} rotuloAria="Vendas contra a meta: 94,8%" />
      <div className="s-barras s-barras-depois">
        <Barra rotulo="Vendedor A" valor="112%" pct={(100 * 112) / 130} marca={(100 * 100) / 130} tom="ok" />
        <Barra rotulo="Vendedor B" valor="97%" pct={(100 * 97) / 130} marca={(100 * 100) / 130} tom="warn" />
        <Barra rotulo="Vendedor C" valor="84%" pct={(100 * 84) / 130} marca={(100 * 100) / 130} tom="crit" />
      </div>
    </>
  ),
  financeiro: () => (
    <>
      <Topo titulo="Próximos dias" lado="Cliente Demo" />
      <div className="s-barras">
        <Barra rotulo="Entra em 30 dias" valor="R$ 5,26 mi" pct={83} tom="ok" />
        <Barra rotulo="Sai em 30 dias" valor="R$ 3,66 mi" pct={58} tom="ink" />
        <Barra rotulo="Entra em 60 dias" valor="R$ 9,80 mi" pct={100} tom="ok" />
        <Barra rotulo="Sai em 60 dias" valor="R$ 8,95 mi" pct={91} tom="ink" />
      </div>
      <div className="s-vencido">
        <Linha status="critico" nome="Vencido" texto="R$ 412 mil a receber em atraso" />
      </div>
    </>
  ),
  pessoas: () => (
    <>
      <Topo titulo="Custo da equipe por mês" lado="Cliente Demo" />
      <CustoMes valores={[612, 618, 631, 629, 644, 652]} />
      <div className="s-mini-nota">
        <Cadeado />
        <span>Nomes e salários só para quem você autorizar.</span>
      </div>
    </>
  ),
  operacao: () => (
    <>
      <Topo titulo="Estoque" lado={<Pill status="saudavel" />} />
      <div className="s-barras">
        <Barra rotulo="Cobertura de estoque" valor="38 dias" pct={63} marca={50} tom="ok" />
        <Barra rotulo="Vendas perdidas por falta de produto" valor="1,2%" pct={30} marca={35} tom="ok" />
        <Barra rotulo="Produtos parados há 90+ dias" valor="6%" pct={40} marca={33} tom="warn" />
      </div>
      <div className="s-mini-nota">
        <span>O que aparece aqui segue o seu segmento.</span>
      </div>
    </>
  ),
};

export function Setores() {
  const s = CONTEUDO.setores;
  const [aberta, setAberta] = useState(0);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);

  const teclado = (e: KeyboardEvent, i: number) => {
    const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const n = (i + passo + s.abas.length) % s.abas.length;
    setAberta(n);
    abas.current[n]?.focus();
  };

  return (
    <section id="o-que-voce-ve" className="s-sec s-sem-topo" aria-labelledby="set-t">
      <div className="s-wrap">
        <TituloSecao id="set-t" sobretitulo={s.sobretitulo} titulo={s.titulo} />
        <div className="s-set-abas s-rv" role="tablist" aria-label="Setores">
          {s.abas.map((a, i) => (
            <button
              key={a.id}
              ref={(el) => {
                abas.current[i] = el;
              }}
              className="s-set-aba"
              type="button"
              role="tab"
              id={`s-aba-${a.id}`}
              aria-controls={`s-painel-${a.id}`}
              aria-selected={i === aberta}
              tabIndex={i === aberta ? 0 : -1}
              onClick={() => setAberta(i)}
              onKeyDown={(e) => teclado(e, i)}
            >
              {a.nome}
            </button>
          ))}
        </div>
        {s.abas.map((a, i) => (
          <div
            key={a.id}
            className={i === aberta ? 's-set-painel s-on' : 's-set-painel'}
            role="tabpanel"
            id={`s-painel-${a.id}`}
            aria-labelledby={`s-aba-${a.id}`}
            hidden={i !== aberta}
          >
            <div>
              <ul className="s-set-perguntas">
                {a.perguntas.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              {'nota' in a && <p className="s-set-nota">{a.nota}</p>}
            </div>
            <div className="s-mini" role="group" aria-label="Exemplo com dados do Cliente Demo">
              {i === aberta && EXEMPLOS[a.id]?.()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
