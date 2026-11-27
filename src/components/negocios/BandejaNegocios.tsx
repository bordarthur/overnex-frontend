import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useValoresNegocios } from '../../api/useValoresNegocios';
import { estadoDe, unidadesDaArvore, unidadesDoSetor, type Estado, type Negocios } from '../../app/negocios';
import type { EscopoSetor, GrupoNegocio, SetorNegocio } from '../../contracts/negocios';
import type { Valor } from '../../contracts/visaoGeral';
import { formatarValor } from '../../format';
import { CampoBusca } from '../CampoBusca';
import './Negocios.css';

// A lista de unidades ganha busca a partir de tantas unidades.
const BUSCA_A_PARTIR_DE = 9;
const MSG_UMA = 'Pelo menos uma unidade fica marcada, para os gráficos não zerarem.';

const ICONE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

// Ícone de cada setor (os ids de cfg.setor); setor novo fica com o de camadas.
const ICONES_SETOR: Record<string, ReactNode> = {
  distribuidora: (
    <>
      <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.4v2.6h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  varejo: (
    <>
      <path d="M5 8.5h14l-1.1 11.5H6.1z" />
      <path d="M9 8.5V7a3 3 0 016 0v1.5" />
    </>
  ),
  industria: (
    <>
      <path d="M3 20.5h18M5.5 20.5V9.5l5-3v14M10.5 20.5V4l8 4v12.5" />
      <path d="M13.5 10.5h2M13.5 14h2M7.5 12h1M7.5 15.5h1" />
    </>
  ),
};
const ICONE_PADRAO = (
  <>
    <path d="M12 3.5l8.5 4.3-8.5 4.3-8.5-4.3z" />
    <path d="M3.5 12.2l8.5 4.3 8.5-4.3" />
    <path d="M3.5 16.4l8.5 4.3 8.5-4.3" />
  </>
);

const Marca = ({ estado }: { estado: Estado }) => (
  <span className="sc-b" aria-hidden="true">
    <svg viewBox="0 0 10 10">
      {estado === 'mixed' ? (
        <path d="M2.6 5h4.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      ) : (
        <path
          d="M2 5.3l2 2 4-4.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  </span>
);

const pressionado = (e: Estado) => (e === 'on' ? 'true' : e === 'mixed' ? 'mixed' : 'false');
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const juntar = (partes: (string | false | undefined)[]) => partes.filter(Boolean).join(' · ');

interface Props {
  id: string;
  aberta: boolean;
  negocios: Negocios;
  /** o painel aberto só vale nestes setores: os outros ficam travados */
  escopo?: EscopoSetor | null;
  /** o mês da tela, para os valores */
  mes?: string;
}

/**
 * Bandeja "Negócios" (mockup M3.1.0): setor › grupo em árvore, com as unidades embaixo. Abre acima do
 * título e empurra o conteúdo. Cada clique grava a escolha na URL; a tela pede os números de novo.
 */
export function BandejaNegocios({ id, aberta, negocios, escopo, mes }: Props) {
  const { arvore, marcadas, nomes, mudar } = negocios;
  const valores = useValoresNegocios(mes, aberta).data;
  // setor recolhido: o que foi desmarcado inteiro (some a linha dos grupos dele)
  const [abertos, setAbertos] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(arvore.setores.map((s) => [s.id, estadoDe(unidadesDoSetor(s), marcadas) !== 'off'])),
  );
  // ao clicar na lista, ela fica parada (não some a unidade desmarcada do último grupo)
  const [listaFixa, setListaFixa] = useState<string[] | null>(null);
  const [busca, setBusca] = useState('');
  const [recusa, setRecusa] = useState<{ alvo: string; vez: number } | null>(null);

  useEffect(() => {
    if (!recusa) return;
    const t = setTimeout(() => setRecusa(null), 4000);
    return () => clearTimeout(t);
  }, [recusa]);

  const travado = (s: SetorNegocio) => !!escopo && !escopo.setores.includes(s.id);
  const valor = (v: Valor | undefined) => (v ? formatarValor(v) : undefined);

  const gravar = (novas: Set<string>, alvo: string, daLista = false) => {
    if (!daLista) setListaFixa(null);
    const ok = mudar(novas);
    if (!ok) setRecusa((r) => ({ alvo, vez: (r?.vez ?? 0) + 1 }));
    return ok;
  };
  const com = (ids: string[]) => new Set([...marcadas, ...ids]);
  const sem = (ids: string[]) => new Set([...marcadas].filter((i) => !ids.includes(i)));
  const abrirSo = (setor: string) =>
    setAbertos(Object.fromEntries(arvore.setores.map((s) => [s.id, s.id === setor])));

  const clicarSetor = (s: SetorNegocio) => {
    const ids = unidadesDoSetor(s);
    if (!abertos[s.id]) {
      setAbertos((a) => ({ ...a, [s.id]: true }));
      gravar(com(ids), `s:${s.id}`);
    } else if (estadoDe(ids, marcadas) === 'off') gravar(com(ids), `s:${s.id}`);
    else if (gravar(sem(ids), `s:${s.id}`)) setAbertos((a) => ({ ...a, [s.id]: false }));
  };
  const clicarGrupo = (g: GrupoNegocio) =>
    gravar(estadoDe(g.unidades, marcadas) === 'off' ? com(g.unidades) : sem(g.unidades), `g:${g.id}`);

  const todasDaArvore = unidadesDaArvore(arvore);
  const setoresAbertos = arvore.setores.filter((s) => abertos[s.id]);
  const gruposVisiveis = setoresAbertos.flatMap((s) => s.grupos);
  const setoresTodos =
    arvore.setores.every((s) => abertos[s.id]) && todasDaArvore.every((i) => marcadas.has(i));
  const gruposTodos = gruposVisiveis.every((g) => estadoDe(g.unidades, marcadas) === 'on');

  const clicarTodosSetores = () => {
    const primeiro = arvore.setores[0];
    if (setoresTodos && primeiro) {
      abrirSo(primeiro.id);
      gravar(new Set(unidadesDoSetor(primeiro)), 'todos-setores');
    } else {
      setAbertos(Object.fromEntries(arvore.setores.map((s) => [s.id, true])));
      gravar(new Set(todasDaArvore), 'todos-setores');
    }
  };
  const clicarTodosGrupos = () => {
    const primeiro = gruposVisiveis[0];
    if (gruposTodos && primeiro) gravar(new Set(primeiro.unidades), 'todos-grupos');
    else gravar(com(gruposVisiveis.flatMap((g) => g.unidades)), 'todos-grupos');
  };

  // unidades dos grupos marcados, na ordem da árvore
  const listadas =
    listaFixa ??
    arvore.setores.flatMap((s) =>
      s.grupos.filter((g) => estadoDe(g.unidades, marcadas) !== 'off').flatMap((g) => g.unidades),
    );
  const setorDaUnidade = new Map(
    arvore.setores.flatMap((s) => unidadesDoSetor(s).map((u) => [u, s] as const)),
  );
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const visiveis = listadas.filter(
    (u) => !termo || (nomes.get(u) ?? '').toLocaleLowerCase('pt-BR').includes(termo),
  );
  const marcadasNaLista = listadas.filter((u) => marcadas.has(u)).length;
  const listaToda = marcadasNaLista === listadas.length;

  const clicarUnidade = (u: string) => {
    setListaFixa(listadas);
    gravar(marcadas.has(u) ? sem([u]) : com([u]), `u:${u}`, true);
  };
  const clicarTodasUnidades = () => {
    setListaFixa(listadas);
    const primeira = listadas[0];
    if (!primeira) return;
    gravar(listaToda ? new Set([primeira]) : com(listadas), 'todas-unidades', true);
  };

  const tremendo = (alvo: string) => (recusa?.alvo === alvo ? ` nope v${recusa.vez % 2}` : '');

  const tituloTrava = escopo?.rotulo;

  return (
    <section className="scope" id={id} data-open={aberta} aria-label="Negócios" inert={!aberta}>
      <div className="sc-body">
        <div className="sc-in">
          <div className="sc-pad">
            <div className="sc-tree">
              <div className="sc-labs" aria-hidden="true">
                <span className="sc-lab">Setor</span>
                <span className="sc-lab">Grupo</span>
              </div>
              {arvore.setores.map((s) => {
                const ids = unidadesDoSetor(s);
                const estado = estadoDe(ids, marcadas);
                const trava = travado(s);
                const gruposCom = s.grupos.filter((g) => estadoDe(g.unidades, marcadas) !== 'off').length;
                const contagem =
                  estado === 'mixed'
                    ? s.grupos.length > 1
                      ? `${gruposCom} de ${s.grupos.length} grupos`
                      : `${ids.filter((i) => marcadas.has(i)).length} de ${ids.length} unidades`
                    : plural(ids.length, 'unidade', 'unidades');
                return (
                  <div
                    key={s.id}
                    className={`sc-col${abertos[s.id] ? '' : ' fold'}${trava ? ' sc-dis' : ''}`}
                    style={
                      {
                        '--n': s.grupos.length,
                        '--g': abertos[s.id] ? s.grupos.length + 0.5 : 1,
                      } as CSSProperties
                    }
                  >
                    <div className="sc-w">
                      <button
                        type="button"
                        className={`sc-t sc-g${tremendo(`s:${s.id}`)}`}
                        aria-pressed={pressionado(estado)}
                        disabled={trava}
                        title={trava ? tituloTrava : `${estado === 'off' ? 'Somar' : 'Tirar'} ${s.rotulo}`}
                        onClick={() => clicarSetor(s)}
                      >
                        <svg className="sc-gi" {...ICONE} aria-hidden="true">
                          {ICONES_SETOR[s.id] ?? ICONE_PADRAO}
                        </svg>
                        <span className="sc-tx">
                          <span className="sc-n">{s.rotulo}</span>
                          <span className="sc-m">{juntar([valor(valores?.setores[s.id]), contagem])}</span>
                        </span>
                        <Marca estado={estado} />
                      </button>
                      {!trava && (
                        <button
                          type="button"
                          className="sc-only"
                          aria-label={`Só ${s.rotulo}`}
                          onClick={() => {
                            abrirSo(s.id);
                            gravar(new Set(ids), `s:${s.id}`);
                          }}
                        >
                          só este
                        </button>
                      )}
                    </div>
                    <div
                      className="sc-subs"
                      role="group"
                      aria-label={`Grupos de ${s.rotulo}`}
                      inert={!abertos[s.id]}
                    >
                      {s.grupos.map((g) => {
                        const eg = estadoDe(g.unidades, marcadas);
                        const k = g.unidades.filter((i) => marcadas.has(i)).length;
                        return (
                          <div key={g.id} className="sc-w">
                            <button
                              type="button"
                              className={`sc-t sc-s${tremendo(`g:${g.id}`)}`}
                              aria-pressed={pressionado(eg)}
                              disabled={trava}
                              title={trava ? tituloTrava : g.rotulo}
                              onClick={() => clicarGrupo(g)}
                            >
                              <span className="sc-tx">
                                <span className="sc-n">{g.rotulo}</span>
                                <span className="sc-m">
                                  {juntar([
                                    valor(valores?.grupos[g.id]),
                                    eg === 'mixed'
                                      ? `${k} de ${g.unidades.length} unidades`
                                      : plural(g.unidades.length, 'unidade', 'unidades'),
                                  ])}
                                </span>
                              </span>
                              <Marca estado={eg} />
                            </button>
                            {!trava && (
                              <button
                                type="button"
                                className="sc-only"
                                aria-label={`Só ${g.rotulo}`}
                                onClick={() => {
                                  abrirSo(s.id);
                                  gravar(new Set(g.unidades), `g:${g.id}`);
                                }}
                              >
                                só este
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="sc-alls">
                <BotaoTodos
                  classe={`ag${tremendo('todos-setores')}`}
                  cheio={setoresTodos}
                  contagem={`${arvore.setores.filter((s) => estadoDe(unidadesDoSetor(s), marcadas) !== 'off').length} de ${arvore.setores.length}`}
                  sufixo="setores"
                  onClick={clicarTodosSetores}
                />
                <BotaoTodos
                  classe={`as${tremendo('todos-grupos')}`}
                  cheio={gruposTodos}
                  contagem={`${gruposVisiveis.filter((g) => estadoDe(g.unidades, marcadas) !== 'off').length} de ${gruposVisiveis.length}`}
                  sufixo="grupos"
                  onClick={clicarTodosGrupos}
                />
              </div>
            </div>

            <div className="sc-unit sc-lj">
              <span className="sc-lab">Unidades</span>
              <div className="lj">
                <div className="lj-main">
                  {listadas.length >= BUSCA_A_PARTIR_DE && (
                    <div className="lj-q">
                      <CampoBusca rotulo="Buscar unidade" valor={busca} onMudar={setBusca} />
                    </div>
                  )}
                  <div className="lj-list" role="group" aria-label="Unidades">
                    {visiveis.map((u) => {
                      const trava = (() => {
                        const s = setorDaUnidade.get(u);
                        return s ? travado(s) : false;
                      })();
                      return (
                        <button
                          key={u}
                          type="button"
                          role="checkbox"
                          aria-checked={marcadas.has(u)}
                          className={`lj-it${tremendo(`u:${u}`)}`}
                          disabled={trava}
                          title={trava ? tituloTrava : undefined}
                          onClick={() => clicarUnidade(u)}
                        >
                          <span className="um-box" aria-hidden="true">
                            <svg viewBox="0 0 10 10">
                              <path
                                d="M2 5.3l2 2 4-4.6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span className="lj-n">{nomes.get(u) ?? u}</span>
                          {valores?.unidades[u] && (
                            <span className="um-v">{formatarValor(valores.unidades[u])}</span>
                          )}
                        </button>
                      );
                    })}
                    {visiveis.length === 0 && <p className="um-empty">Nenhuma unidade com esse nome.</p>}
                  </div>
                </div>
                <div className="lj-alls">
                  <BotaoTodos
                    classe={`lj-all${tremendo('todas-unidades')}`}
                    rotulo="Todas"
                    cheio={listaToda}
                    contagem={`${marcadasNaLista} de ${listadas.length}`}
                    onClick={clicarTodasUnidades}
                  />
                </div>
              </div>
            </div>

            <div className="sc-foot">
              {escopo ? (
                <span className="sc-dnote">{escopo.rotulo}</span>
              ) : (
                <span className="sc-cap">Unidades dos grupos marcados</span>
              )}
              {valores && <span className="sc-cap r">{valores.rotulo}</span>}
            </div>
            <p className="sc-aviso" role="status">
              {recusa ? MSG_UMA : ''}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BotaoTodos({
  classe,
  rotulo = 'Todos',
  cheio,
  contagem,
  sufixo,
  onClick,
}: {
  classe: string;
  rotulo?: string;
  cheio: boolean;
  contagem: string;
  sufixo?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sc-all ${classe}`}
      aria-pressed={cheio ? 'true' : 'mixed'}
      title={
        cheio
          ? `Desmarcar ${rotulo.toLowerCase()} (fica só o primeiro, para os gráficos não zerarem)`
          : `Marcar ${rotulo.toLowerCase()}`
      }
      onClick={onClick}
    >
      <Marca estado={cheio ? 'on' : 'mixed'} />
      <span className="sc-tx">
        <span className="sc-n">{rotulo}</span>
        <span className="sc-m">
          {contagem}
          {sufixo && <span className="mob"> {sufixo}</span>}
        </span>
      </span>
    </button>
  );
}
