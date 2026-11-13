import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGravarGestao } from '../../api/useGestao';
import { Gaveta } from '../../components/Gaveta';
import type { NovaEmpresa as CorpoNovaEmpresa } from '../../contracts/gestao';
import { erroDaGravacao } from './apoio';
import './GavetaUsuario.css';

/**
 * O botão "Nova empresa" da barra lateral e a gaveta dele (`POST /api/admin/clientes`): nome e setor.
 * O identificador (slug) é a API que monta, a partir do nome. A empresa nasce com todas as camadas
 * desligadas e sem pessoas; depois de criada, a gaveta mostra o texto da API e a empresa abre.
 */
export function NovaEmpresa() {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button type="button" className="gst-nova" onClick={() => setAberta(true)}>
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M8 3v10M3 8h10" strokeLinecap="round" />
        </svg>
        Nova empresa
      </button>
      {aberta && <GavetaNovaEmpresa onFechar={() => setAberta(false)} />}
    </>
  );
}

function GavetaNovaEmpresa({ onFechar }: { onFechar: () => void }) {
  const id = useId();
  const navegar = useNavigate();
  const [nome, setNome] = useState('');
  const [segmento, setSegmento] = useState('');
  const [tentou, setTentou] = useState(false);
  const criar = useGravarGestao((api, nova: CorpoNovaEmpresa) => api.criarCliente(nova));
  const semNome = tentou && !nome.trim();

  const aoCriar = () => {
    setTentou(true);
    if (!nome.trim()) return;
    criar.mutate(
      { nome: nome.trim(), segmento: segmento.trim() || null, slug: null },
      // a empresa abre atrás da gaveta, que fica com o texto da API
      { onSuccess: (criada) => void navegar(`/gestao/empresas/${criada.slug}`) },
    );
  };

  if (criar.isSuccess)
    return (
      <Gaveta
        titulo="Nova empresa"
        onFechar={onFechar}
        rodape={
          <button type="button" className="btn" onClick={onFechar}>
            Concluir
          </button>
        }
      >
        <p className="gst-ok" role="status">
          {criar.data.mensagem}
        </p>
        <div className="gst-pessoa">
          <b>{criar.data.nome}</b>
        </div>
      </Gaveta>
    );

  return (
    <Gaveta
      titulo="Nova empresa"
      onFechar={onFechar}
      rodape={
        <>
          {criar.isError && (
            <p className="gst-erro gst-gaveta-erro" role="alert">
              {erroDaGravacao(criar.error)}
            </p>
          )}
          <button type="button" className="btn fantasma" onClick={onFechar}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={criar.isPending} onClick={aoCriar}>
            Criar empresa
          </button>
        </>
      }
    >
      <p className="gst-dica">A empresa nasce com todas as camadas desligadas e sem pessoas.</p>
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
