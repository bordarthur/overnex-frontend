import { useId, useState, type FormEvent } from 'react';
import { useGravarGestao } from '../../api/useGestao';
import { Segmentado } from '../../components/Segmentado';
import type { Feriado, PreferenciaDoCliente } from '../../contracts/gestao';
import { formatarData } from '../../format';
import { erroDaGravacao } from './apoio';

interface Props {
  slug: string;
  preferencias: PreferenciaDoCliente[];
  feriados: Feriado[];
}

/** Aba "Preferências": as escolhas gravadas da empresa que a API mandar e os feriados dela. */
export function AbaPreferencias({ slug, preferencias, feriados }: Props) {
  return (
    <>
      {preferencias.length > 0 && (
        <div className="gst-prefs">
          {preferencias.map((p) => (
            <Preferencia key={p.id} slug={slug} preferencia={p} />
          ))}
        </div>
      )}
      <Feriados slug={slug} feriados={feriados} />
    </>
  );
}

function Preferencia({ slug, preferencia: p }: { slug: string; preferencia: PreferenciaDoCliente }) {
  const gravar = useGravarGestao(
    (gestao, valor: string) => gestao.salvarPreferencia(slug, p.id, valor),
    'visao-geral',
  );
  // enquanto grava, a opção escolhida já aparece marcada
  const valor = gravar.isPending ? gravar.variables : p.valor;

  return (
    <section className="gst-cartao gst-pref" aria-label={p.rotulo} aria-busy={gravar.isPending}>
      <h2>{p.rotulo}</h2>
      <p className="sub">{p.descricao}</p>
      <Segmentado
        rotulo={p.rotulo}
        opcoes={p.opcoes}
        valor={valor}
        desabilitado={!p.editavel || gravar.isPending}
        onMudar={(v) => {
          if (v !== valor) gravar.mutate(v);
        }}
      />
      {gravar.isError && (
        <p className="gst-erro" role="alert">
          {erroDaGravacao(gravar.error)}
        </p>
      )}
    </section>
  );
}

type MudancaFeriado = { tipo: 'incluir'; data: string; nome: string } | { tipo: 'tirar'; data: string };

function Feriados({ slug, feriados }: { slug: string; feriados: Feriado[] }) {
  const idTitulo = useId();
  const [data, setData] = useState('');
  const [nome, setNome] = useState('');
  const gravar = useGravarGestao(
    (gestao, m: MudancaFeriado) =>
      m.tipo === 'incluir' ? gestao.salvarFeriado(slug, m.data, m.nome) : gestao.tirarFeriado(slug, m.data),
    'telas',
  );

  const incluir = (e: FormEvent) => {
    e.preventDefault();
    if (!data || !nome.trim()) return;
    gravar.mutate(
      { tipo: 'incluir', data, nome: nome.trim() },
      {
        onSuccess: () => {
          setData('');
          setNome('');
        },
      },
    );
  };

  return (
    <section className="gst-cartao" aria-labelledby={idTitulo} aria-busy={gravar.isPending}>
      <h2 id={idTitulo}>Feriados da empresa</h2>
      <p className="sub">
        Entram na conta dos dias úteis. Os feriados nacionais entram sozinhos; os estaduais, os municipais e
        as pontes, a BORD marca aqui.
      </p>
      {gravar.isError && (
        <p className="gst-erro" role="alert">
          {erroDaGravacao(gravar.error)}
        </p>
      )}
      {feriados.length > 0 ? (
        <ul className="gst-feriados">
          {feriados.map((f) => (
            <li key={f.data}>
              <span className="num">{formatarData(f.data)}</span>
              <span>{f.nome}</span>
              <button
                type="button"
                className="link perigo"
                aria-label={`Tirar ${f.nome}, ${formatarData(f.data)}`}
                disabled={gravar.isPending}
                onClick={() => gravar.mutate({ tipo: 'tirar', data: f.data })}
              >
                Tirar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="gst-vazio">Nenhum feriado próprio cadastrado.</p>
      )}
      <form className="gst-feriado-novo" onSubmit={incluir}>
        <label>
          <span>Dia</span>
          <input type="date" required value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="gst-feriado-nome">
          <span>Nome do feriado</span>
          <input
            type="text"
            required
            maxLength={80}
            autoComplete="off"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <button type="submit" className="btn" disabled={gravar.isPending}>
          Incluir feriado
        </button>
      </form>
    </section>
  );
}
