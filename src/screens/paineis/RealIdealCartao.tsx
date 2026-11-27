import { useCallback, useRef, useState } from 'react';
import type { CartaoRealIdeal, ItemRealIdeal } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { STATUS } from '../../theme/status';
import { CaixaCartao } from './CaixaCartao';
import './Estoque.css';

/** O caminho aberto: os itens de cada nível, pelos ids, até onde existirem na resposta. */
function abrirCaminho(raiz: ItemRealIdeal[], ids: string[]): ItemRealIdeal[] {
  const abertos: ItemRealIdeal[] = [];
  let nivel = raiz;
  for (const id of ids) {
    const item = nivel.find((i) => i.id === id && i.itens && i.itens.length > 0);
    if (!item?.itens) break;
    abertos.push(item);
    nivel = item.itens;
  }
  return abertos;
}

/**
 * Estoque real contra o ideal: a barra é o estoque de hoje, o traço é o ideal. Cada linha abre o
 * nível de baixo (seção › família › produto), com a trilha para voltar. Com o filtro Seção, a API
 * manda o caminho aberto (`aberto`), e a tela começa nele.
 */
export function RealIdealCartao({ cartao }: { cartao: CartaoRealIdeal }) {
  const chaveAberto = (cartao.aberto ?? []).join('/');
  const [caminho, setCaminho] = useState<{ de: string; ids: string[] }>({
    de: chaveAberto,
    ids: cartao.aberto ?? [],
  });
  // outro caminho de início (o filtro Seção mudou): a tela vai para ele
  if (caminho.de !== chaveAberto) setCaminho({ de: chaveAberto, ids: cartao.aberto ?? [] });

  const abertos = abrirCaminho(cartao.itens, caminho.ids);
  const atual = abertos.at(-1);
  const itens = atual?.itens ?? cartao.itens;
  const ir = (ids: string[]) => setCaminho((c) => ({ ...c, ids }));

  // ao abrir um nível, o foco vai para o último passo da trilha (a linha clicada some)
  const focarTrilha = useRef(false);
  const ultimoPasso = useCallback((el: HTMLElement | null) => {
    if (el && focarTrilha.current) {
      el.focus();
      focarTrilha.current = false;
    }
  }, []);

  const maior = Math.max(1, ...itens.flatMap((i) => [i.real, i.ideal])) * 1.04;
  const pct = (v: number) => `${(Math.max(0, v) / maior) * 100}%`;
  const fmt = (v: number) => formatarValor({ ...cartao.escala, valor: v });

  return (
    <CaixaCartao cartao={atual?.subtituloAberto ? { ...cartao, subtitulo: atual.subtituloAberto } : cartao}>
      <nav className="ri-trilha" aria-label="Trilha">
        {abertos.length === 0 ? (
          <b>{cartao.rotuloRaiz}</b>
        ) : (
          <>
            <button type="button" className="link" onClick={() => ir([])}>
              {cartao.rotuloRaiz}
            </button>
            {abertos.map((a, k) => (
              <span key={a.id} className="ri-passo">
                <span aria-hidden="true">›</span>
                {k === abertos.length - 1 ? (
                  <b ref={ultimoPasso} tabIndex={-1} aria-current="location">
                    {a.nome}
                  </b>
                ) : (
                  <button type="button" className="link" onClick={() => ir(caminho.ids.slice(0, k + 1))}>
                    {a.nome}
                  </button>
                )}
              </span>
            ))}
          </>
        )}
      </nav>
      <ul className="ri-lista">
        {itens.map((item) => {
          const abre = !item.outros && !!item.itens && item.itens.length > 0;
          const classe = STATUS[item.status].classe;
          const conteudo = (
            <>
              <span className="ri-nome">
                {item.nome}
                <small>{item.sub}</small>
              </span>
              <span className="ri-trilho" aria-hidden="true">
                <span className={`ri-barra ${classe}`} style={{ width: pct(item.real) }} />
                <i className="ri-ideal" style={{ left: pct(item.ideal) }} />
              </span>
              <span className="ri-valor">
                <b>{fmt(item.real)}</b>
                <span className={`t-${classe}`}>{item.diferenca}</span>
                <span className="visualmente-oculto">, ideal {fmt(item.ideal)}</span>
              </span>
            </>
          );
          return (
            <li key={item.id} className={item.outros ? 'ri-outros' : undefined}>
              {abre ? (
                <button
                  type="button"
                  className="ri-linha abre"
                  title={`Real ${fmt(item.real)} · ideal ${fmt(item.ideal)}`}
                  onClick={() => {
                    focarTrilha.current = true;
                    ir([...abertos.map((a) => a.id), item.id]);
                  }}
                >
                  {conteudo}
                </button>
              ) : (
                <div className="ri-linha" title={`Real ${fmt(item.real)} · ideal ${fmt(item.ideal)}`}>
                  {conteudo}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </CaixaCartao>
  );
}
