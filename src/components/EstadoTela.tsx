import { Simbolo } from './Marca';
import './EstadoTela.css';

type TipoEstado = 'carregando' | 'erro' | 'sem-permissao' | 'vazio';

const TEXTO: Record<TipoEstado, string> = {
  carregando: 'Carregando o painel…',
  erro: 'Não conseguimos carregar o painel agora.',
  'sem-permissao': 'Você não tem acesso a esta tela. Fale com o gestor do seu painel.',
  vazio: 'Ainda não há dados para este período.',
};

interface PropsEstadoTela {
  tipo: TipoEstado;
  onTentarDeNovo?: () => void;
  /** Sem permissão: sai para entrar com outra conta. */
  onSair?: () => void;
}

/** Estados da tela fora do caminho feliz, no tom da marca. */
export function EstadoTela({ tipo, onTentarDeNovo, onSair }: PropsEstadoTela) {
  return (
    <div className={`estado estado-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <Simbolo className="estado-sym" />
      <p>{TEXTO[tipo]}</p>
      {tipo === 'erro' && onTentarDeNovo && (
        <button type="button" className="btn" onClick={onTentarDeNovo}>
          Tentar de novo
        </button>
      )}
      {tipo === 'sem-permissao' && onSair && (
        <button type="button" className="link" onClick={onSair}>
          Entrar com outra conta
        </button>
      )}
    </div>
  );
}
