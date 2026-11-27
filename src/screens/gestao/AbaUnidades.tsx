import { useId, useState } from 'react';
import { useGravarGestao } from '../../api/useGestao';
import { Gaveta } from '../../components/Gaveta';
import type { MudancaUnidade, Rotulado, UnidadeDaGestao } from '../../contracts/gestao';
import { erroDaGravacao } from './apoio';
import './GavetaUsuario.css';
import './AbaUnidades.css';

const SEM_VALOR = '–';

// as siglas dos estados, para a lista do campo UF (quem confere é a API)
const UFS = 'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ');

/** "Fortaleza/CE", "Fortaleza", "CE" ou nada. */
const local = (u: UnidadeDaGestao) => [u.cidade, u.uf].filter(Boolean).join('/') || SEM_VALOR;

interface Props {
  slug: string;
  unidades: UnidadeDaGestao[];
  /** o "Editar" de cada linha (`permissoes.unidades`) */
  podeEditar: boolean;
  /** opções do campo Setor (`opcoesSetor`) */
  setores: Rotulado[];
}

/**
 * Aba "Unidades": o cadastro de unidades da empresa (lojas, filiais), com setor, segmento, grupo e
 * endereço, as colunas da tabela de unidades da LANN. É ele que monta a bandeja "Negócios" das
 * telas. Quem pode (`permissoes.unidades`) edita cada linha; unidade nova continua por SQL, porque
 * ela precisa estar ligada aos dados da carga.
 */
export function AbaUnidades({ slug, unidades, podeEditar, setores }: Props) {
  const [editando, setEditando] = useState<UnidadeDaGestao | null>(null);
  // sugestões dos campos de texto: o que já existe nesta empresa, para não escrever o grupo de dois jeitos
  const grupos = [...new Set(unidades.map((u) => u.grupo).filter((g): g is string => !!g))];
  const segmentos = [...new Set(unidades.map((u) => u.segmento).filter((s): s is string => !!s))];
  return (
    <section className="gst-cartao" aria-labelledby="gst-unidades-titulo">
      <h2 id="gst-unidades-titulo">Unidades da empresa</h2>
      <p className="sub">
        Cada unidade tem um setor e um grupo; é isso que monta o botão “Negócios” das telas.
        {podeEditar
          ? ' Unidade nova é cadastrada pela BORD, porque precisa estar ligada aos dados da carga.'
          : ' O cadastro é feito pela BORD.'}
      </p>
      <div className="scroll-x">
        <table className="tbl gst-tbl">
          <thead>
            <tr>
              <th scope="col" className="l">
                Unidade
              </th>
              <th scope="col" className="l">
                Setor
              </th>
              <th scope="col" className="l">
                Segmento
              </th>
              <th scope="col" className="l">
                Grupo
              </th>
              <th scope="col" className="l">
                Cidade
              </th>
              <th scope="col" className="l">
                Endereço
              </th>
              {podeEditar && (
                <th scope="col">
                  <span className="visualmente-oculto">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {unidades.map((u) => (
              <tr key={u.id}>
                <td className="l forte">{u.nome}</td>
                <td className="l">{u.setor?.rotulo ?? SEM_VALOR}</td>
                <td className="l">{u.segmento ?? SEM_VALOR}</td>
                <td className="l">{u.grupo ?? SEM_VALOR}</td>
                <td className="l">{local(u)}</td>
                <td className="l">{[u.endereco, u.bairro].filter(Boolean).join(', ') || SEM_VALOR}</td>
                {podeEditar && (
                  <td>
                    <button
                      type="button"
                      className="link"
                      aria-label={`Editar ${u.nome}`}
                      onClick={() => setEditando(u)}
                    >
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {unidades.length === 0 && (
              <tr>
                <td colSpan={podeEditar ? 7 : 6} className="l gst-vazio">
                  Nenhuma unidade cadastrada para esta empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editando && (
        <GavetaUnidade
          slug={slug}
          unidade={editando}
          setores={setores}
          grupos={grupos}
          segmentos={segmentos}
          onFechar={() => setEditando(null)}
        />
      )}
    </section>
  );
}

interface PropsGaveta {
  slug: string;
  unidade: UnidadeDaGestao;
  setores: Rotulado[];
  grupos: string[];
  segmentos: string[];
  onFechar: () => void;
}

/** A gaveta "Editar unidade" (`PUT /api/admin/clientes/{slug}/unidades/{id}`). */
function GavetaUnidade({ slug, unidade, setores, grupos, segmentos, onFechar }: PropsGaveta) {
  const id = useId();
  const [campos, setCampos] = useState({
    nome: unidade.nome,
    setor: unidade.setor?.id ?? '',
    segmento: unidade.segmento ?? '',
    grupo: unidade.grupo ?? '',
    uf: unidade.uf ?? '',
    cidade: unidade.cidade ?? '',
    bairro: unidade.bairro ?? '',
    endereco: unidade.endereco ?? '',
  });
  const [tentou, setTentou] = useState(false);
  const mudar = (campo: keyof typeof campos) => (e: { target: { value: string } }) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }));
  // setor e grupo mudam a bandeja e o menu das telas: a sessão e as telas também são pedidas de novo
  const salvar = useGravarGestao(
    (api, mudanca: MudancaUnidade) => api.salvarUnidade(slug, unidade.id, mudanca),
    'unidades',
  );
  const semNome = tentou && !campos.nome.trim();
  const ou = (v: string) => v.trim() || null;

  const aoSalvar = () => {
    setTentou(true);
    if (!campos.nome.trim()) return;
    salvar.mutate(
      {
        nome: campos.nome.trim(),
        setor: campos.setor || null,
        segmento: ou(campos.segmento),
        grupo: ou(campos.grupo),
        uf: campos.uf || null,
        cidade: ou(campos.cidade),
        bairro: ou(campos.bairro),
        endereco: ou(campos.endereco),
      },
      { onSuccess: onFechar },
    );
  };

  // o setor gravado que não está nas opções (lista mudou) continua aparecendo
  const opcoesSetor =
    unidade.setor && !setores.some((s) => s.id === unidade.setor?.id) ? [...setores, unidade.setor] : setores;
  const texto = (
    campo: keyof typeof campos,
    rotulo: string,
    maximo: number,
    lista?: string[],
    dica?: string,
  ) => (
    <div className="gst-campo">
      <label htmlFor={`${id}-${campo}`}>{rotulo}</label>
      <input
        id={`${id}-${campo}`}
        type="text"
        autoComplete="off"
        maxLength={maximo}
        value={campos[campo]}
        list={lista && lista.length > 0 ? `${id}-${campo}-lista` : undefined}
        aria-describedby={dica ? `${id}-${campo}-dica` : undefined}
        onChange={mudar(campo)}
      />
      {lista && lista.length > 0 && (
        <datalist id={`${id}-${campo}-lista`}>
          {lista.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      )}
      {dica && (
        <span id={`${id}-${campo}-dica`} className="gst-dica">
          {dica}
        </span>
      )}
    </div>
  );

  return (
    <Gaveta
      titulo="Editar unidade"
      onFechar={onFechar}
      rodape={
        <>
          {salvar.isError && (
            <p className="gst-erro gst-gaveta-erro" role="alert">
              {erroDaGravacao(salvar.error)}
            </p>
          )}
          <button type="button" className="btn fantasma" onClick={onFechar}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={salvar.isPending} onClick={aoSalvar}>
            Salvar alterações
          </button>
        </>
      }
    >
      <div className="gst-campo">
        <label htmlFor={`${id}-nome`}>Unidade</label>
        <input
          id={`${id}-nome`}
          type="text"
          autoComplete="off"
          maxLength={120}
          value={campos.nome}
          aria-invalid={semNome || undefined}
          aria-describedby={semNome ? `${id}-nome-erro` : undefined}
          onChange={mudar('nome')}
        />
        {semNome && (
          <span id={`${id}-nome-erro`} className="gst-campo-erro" role="alert">
            Informe o nome da unidade.
          </span>
        )}
      </div>
      <div className="gst-campo">
        <label htmlFor={`${id}-setor`}>Setor</label>
        <select
          id={`${id}-setor`}
          className="gst-lista"
          value={campos.setor}
          aria-describedby={`${id}-setor-dica`}
          onChange={mudar('setor')}
        >
          <option value="">Não definido</option>
          {opcoesSetor.map((s) => (
            <option key={s.id} value={s.id}>
              {s.rotulo}
            </option>
          ))}
        </select>
        <span id={`${id}-setor-dica`} className="gst-dica">
          Decide os painéis do setor (o Estoque é da Distribuidora).
        </span>
      </div>
      {texto('segmento', 'Segmento', 80, segmentos, 'Ex.: Calçados, Vestuário.')}
      {texto('grupo', 'Grupo', 80, grupos, 'As unidades do mesmo grupo ficam juntas na bandeja “Negócios”.')}
      <div className="gst-duplo">
        <div className="gst-campo">
          <label htmlFor={`${id}-uf`}>UF</label>
          <select id={`${id}-uf`} className="gst-lista" value={campos.uf} onChange={mudar('uf')}>
            <option value="">–</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
        {texto('cidade', 'Cidade', 80)}
      </div>
      {texto('bairro', 'Bairro', 80)}
      {texto('endereco', 'Endereço', 160)}
    </Gaveta>
  );
}
