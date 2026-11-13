import { useId, useState } from 'react';
import { useGravarGestao } from '../../api/useGestao';
import { Gaveta } from '../../components/Gaveta';
import type { ClienteGestaoPayload, MudancaEmpresa } from '../../contracts/gestao';
import { erroDaGravacao } from './apoio';
import './GavetaUsuario.css';

type Cliente = ClienteGestaoPayload['cliente'];

/**
 * O botão "Editar" do cabeçalho da empresa e a gaveta dele (`PUT /api/admin/clientes/{slug}`): nome e
 * setor. O identificador (slug) não muda e não aparece. Empresa sem setor é preenchida por aqui.
 */
export function EditarEmpresa({ cliente }: { cliente: Cliente }) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn fantasma gst-botao"
        aria-label="Editar empresa"
        onClick={() => setAberta(true)}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M3 13l.6-2.8L10.9 3l2.1 2.1-7.3 7.3L3 13z" strokeLinejoin="round" />
        </svg>
        Editar
      </button>
      {aberta && <GavetaEmpresa cliente={cliente} onFechar={() => setAberta(false)} />}
    </>
  );
}

function GavetaEmpresa({ cliente, onFechar }: { cliente: Cliente; onFechar: () => void }) {
  const id = useId();
  const [nome, setNome] = useState(cliente.nome);
  const [segmento, setSegmento] = useState(cliente.segmento ?? '');
  const [tentou, setTentou] = useState(false);
  // o nome aparece no seletor de empresa e nas telas: a sessão também é pedida de novo
  const salvar = useGravarGestao(
    (api, mudanca: MudancaEmpresa) => api.salvarCliente(cliente.slug, mudanca),
    'acesso',
  );
  const semNome = tentou && !nome.trim();

  const aoSalvar = () => {
    setTentou(true);
    if (!nome.trim()) return;
    salvar.mutate({ nome: nome.trim(), segmento: segmento.trim() || null }, { onSuccess: onFechar });
  };

  return (
    <Gaveta
      titulo="Editar empresa"
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
        <label htmlFor={`${id}-nome`}>Nome</label>
        <input
          id={`${id}-nome`}
          type="text"
          autoComplete="off"
          maxLength={120}
          value={nome}
          aria-invalid={semNome || undefined}
          aria-describedby={semNome ? `${id}-nome-erro` : undefined}
          onChange={(e) => setNome(e.target.value)}
        />
        {semNome && (
          <span id={`${id}-nome-erro`} className="gst-campo-erro" role="alert">
            Informe o nome da empresa.
          </span>
        )}
      </div>
      <div className="gst-campo">
        <label htmlFor={`${id}-setor`}>Setor</label>
        <input
          id={`${id}-setor`}
          type="text"
          autoComplete="off"
          maxLength={80}
          value={segmento}
          aria-describedby={`${id}-setor-dica`}
          onChange={(e) => setSegmento(e.target.value)}
        />
        <span id={`${id}-setor-dica`} className="gst-dica">
          Opcional. Ex.: Distribuição, Restaurante.
        </span>
      </div>
    </Gaveta>
  );
}
