import { Fragment } from 'react';
import { useGravarGestao } from '../../api/useGestao';
import { Chave } from '../../components/Chave';
import { Pill } from '../../components/Pill';
import type { GrupoDoMenu, PainelDoCliente, Rotulado } from '../../contracts/gestao';
import { erroDaGravacao } from './apoio';
import { EtiquetaNivel } from './EtiquetaNivel';

interface Props {
  slug: string;
  paineis: PainelDoCliente[];
  /** prévia do menu do Cliente principal, montada pela API */
  menu: GrupoDoMenu[];
  /** os níveis do catálogo, para a etiqueta de cada painel */
  niveis: Rotulado[];
}

/**
 * Aba "Painéis": liga ou desliga cada painel do catálogo na empresa, por seção do menu, com o nível
 * de cada painel ao lado do nome. Painel sem dado não liga (a
 * chave fica travada, com o motivo que a API mandou); painel já ligado sempre pode ser desligado.
 * Ao lado, a prévia do menu, que a API refaz a cada gravação.
 */
export function AbaPaineis({ slug, paineis, menu, niveis }: Props) {
  const gravar = useGravarGestao(
    (gestao, m: { codigo: string; ligado: boolean }) => gestao.salvarPainel(slug, m.codigo, m.ligado),
    'acesso',
  );
  const gravando = gravar.isPending ? gravar.variables : undefined;

  return (
    <div className="gst-paineis">
      <div aria-busy={gravar.isPending}>
        {gravar.isError && (
          <p className="gst-erro" role="alert">
            {erroDaGravacao(gravar.error)}
          </p>
        )}
        {paineis.map((p, i) => {
          // enquanto grava, a chave já mostra a posição nova
          const ligado = gravando?.codigo === p.codigo ? gravando.ligado : p.ligado;
          const travado = !p.ligado && !p.podeLigar;
          return (
            <Fragment key={p.codigo}>
              {p.secao !== paineis[i - 1]?.secao && <h2 className="gst-grupo">{p.secao}</h2>}
              <div className={travado ? 'gst-painel travado' : 'gst-painel'}>
                <Chave
                  rotulo={`Ligar ${p.nome}`}
                  ocultarRotulo
                  ligada={ligado}
                  desabilitada={travado || gravar.isPending}
                  onMudar={(novo) => gravar.mutate({ codigo: p.codigo, ligado: novo })}
                />
                <div>
                  <b className="gst-painel-nome">
                    {p.nome}
                    <EtiquetaNivel nivel={p.nivel} niveis={niveis} />
                  </b>
                  {p.nota && <p className="gst-painel-nota">{p.nota}</p>}
                </div>
                <Pill status={p.status} rotulo={p.statusRotulo} />
              </div>
            </Fragment>
          );
        })}
      </div>
      <aside className="gst-previa" aria-label="Como o cliente principal vê o menu">
        <h2>Como o cliente principal vê o menu</h2>
        {menu.map((g) => (
          <div key={g.grupo}>
            <p className="gst-previa-grupo">{g.grupo}</p>
            <ul>
              {g.itens.map((item) => (
                <li key={item.nome}>{item.nome}</li>
              ))}
            </ul>
          </div>
        ))}
        {menu.length === 0 && <p className="gst-previa-vazio">Nenhum painel</p>}
        <p className="gst-previa-nota">Atualiza na hora. Painel desligado ou sem dado some do menu.</p>
      </aside>
    </div>
  );
}
