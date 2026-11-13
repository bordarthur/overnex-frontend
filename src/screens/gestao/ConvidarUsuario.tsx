import { useState } from 'react';
import { useGestao } from '../../api/useGestao';
import { GavetaConvite } from './GavetaConvite';

interface Props {
  /** slug da empresa que já vem marcada na gaveta */
  empresa?: string;
  /** texto do botão; sem ele, "Convidar usuário" */
  rotulo?: string;
  /** botão secundário, ao lado de outro principal */
  secundario?: boolean;
}

/** O botão "Convidar usuário" e a gaveta de convite que ele abre. */
export function ConvidarUsuario({ empresa, rotulo = 'Convidar usuário', secundario = false }: Props) {
  // a moldura da Gestão já pediu: aqui vem do cache
  const gestao = useGestao();
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button
        type="button"
        className={secundario ? 'btn fantasma gst-botao' : 'btn gst-botao'}
        disabled={!gestao.data}
        onClick={() => setAberta(true)}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M8 3v10M3 8h10" strokeLinecap="round" />
        </svg>
        {rotulo}
      </button>
      {aberta && gestao.data && (
        <GavetaConvite gestao={gestao.data} empresa={empresa} onFechar={() => setAberta(false)} />
      )}
    </>
  );
}
