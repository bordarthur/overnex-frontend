import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Chip } from './Chip';
import './BarraFiltros.css';

export interface FiltroDef {
  id: string;
  rotulo: string;
  opcoes: string[];
  padrao: string;
  nota?: string;
}

interface PropsBarraFiltros {
  filtros: FiltroDef[];
  valores: Record<string, string>;
  onMudar: (id: string, valor: string) => void;
  onLimpar: () => void;
}

interface MenuAberto {
  id: string;
  left: number;
  top: number;
}

/** Barra de filtros: chips com menu suspenso navegável por teclado (setas, Home, End, Esc). */
export function BarraFiltros({ filtros, valores, onMudar, onLimpar }: PropsBarraFiltros) {
  const [menu, setMenu] = useState<MenuAberto | null>(null);
  const chips = useRef(new Map<string, HTMLButtonElement>());
  const idBase = useId();
  const alterado = filtros.some((f) => (valores[f.id] ?? f.padrao) !== f.padrao);

  const abrir = (id: string) => {
    const r = chips.current.get(id)?.getBoundingClientRect();
    if (!r) return;
    setMenu({ id, left: Math.min(r.left, window.innerWidth - 250), top: r.bottom + 6 });
  };
  const fechar = (devolverFoco: boolean) => {
    if (devolverFoco && menu) chips.current.get(menu.id)?.focus();
    setMenu(null);
  };
  const filtroAberto = menu ? filtros.find((f) => f.id === menu.id) : undefined;

  return (
    <div className="filterbar" role="group" aria-label="Filtros">
      {filtros.map((f) => {
        const valor = valores[f.id] ?? f.padrao;
        return (
          <Chip
            key={f.id}
            ref={(el) => {
              if (el) chips.current.set(f.id, el);
              else chips.current.delete(f.id);
            }}
            rotulo={f.rotulo}
            valor={valor}
            ativo={valor !== f.padrao}
            aberto={menu?.id === f.id}
            idMenu={`${idBase}-menu`}
            onClick={() => (menu?.id === f.id ? fechar(false) : abrir(f.id))}
          />
        );
      })}
      {alterado && (
        <button className="link" type="button" onClick={onLimpar}>
          Limpar filtros
        </button>
      )}
      {menu && filtroAberto && (
        <MenuSuspenso
          key={menu.id}
          id={`${idBase}-menu`}
          filtro={filtroAberto}
          valor={valores[filtroAberto.id] ?? filtroAberto.padrao}
          posicao={menu}
          obterChip={() => chips.current.get(filtroAberto.id) ?? null}
          onEscolher={(v) => {
            onMudar(filtroAberto.id, v);
            fechar(true);
          }}
          onFechar={fechar}
        />
      )}
    </div>
  );
}

interface PropsMenu {
  id: string;
  filtro: FiltroDef;
  valor: string;
  posicao: MenuAberto;
  obterChip: () => HTMLButtonElement | null;
  onEscolher: (valor: string) => void;
  onFechar: (devolverFoco: boolean) => void;
}

function MenuSuspenso({ id, filtro, valor, posicao, obterChip, onEscolher, onFechar }: PropsMenu) {
  const ref = useRef<HTMLDivElement>(null);
  // Callbacks mais recentes, sem refazer os listeners (nem o foco) a cada render do pai.
  const atual = useRef({ obterChip, onFechar });
  useEffect(() => {
    atual.current = { obterChip, onFechar };
  });

  // Foco no item marcado ao abrir; fecha com clique fora, rolagem ou redimensionamento (como o mockup).
  // O menu é montado de novo a cada abertura (key no pai), então este efeito roda uma vez por abertura.
  useEffect(() => {
    const abertoEm = performance.now();
    const el = ref.current;
    el?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    const foraDoMenu = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (!el?.contains(alvo) && !atual.current.obterChip()?.contains(alvo)) atual.current.onFechar(false);
    };
    const rolou = () => {
      if (performance.now() - abertoEm > 250) atual.current.onFechar(false);
    };
    const redimensionou = () => atual.current.onFechar(false);
    document.addEventListener('pointerdown', foraDoMenu);
    window.addEventListener('scroll', rolou, { passive: true });
    window.addEventListener('resize', redimensionou);
    return () => {
      document.removeEventListener('pointerdown', foraDoMenu);
      window.removeEventListener('scroll', rolou);
      window.removeEventListener('resize', redimensionou);
    };
  }, []);

  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const itens = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [],
    );
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement);
    const ir = (i: number) => {
      e.preventDefault();
      itens[(i + itens.length) % itens.length]?.focus();
    };
    if (e.key === 'ArrowDown') ir(atual + 1);
    else if (e.key === 'ArrowUp') ir(atual - 1);
    else if (e.key === 'Home') ir(0);
    else if (e.key === 'End') ir(itens.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      onFechar(true);
    } else if (e.key === 'Tab') onFechar(false);
  };

  return createPortal(
    <div
      ref={ref}
      id={id}
      className="menu open"
      role="menu"
      aria-label={filtro.rotulo}
      style={{ left: posicao.left, top: posicao.top }}
      onKeyDown={teclado}
    >
      <div className="mh" aria-hidden="true">
        {filtro.rotulo}
      </div>
      {filtro.opcoes.map((o) => (
        <button
          key={o}
          type="button"
          role="menuitemradio"
          aria-checked={o === valor}
          tabIndex={-1}
          onClick={() => onEscolher(o)}
        >
          {o}
        </button>
      ))}
      {filtro.nota && <div className="mnote">{filtro.nota}</div>}
    </div>,
    document.body,
  );
}
