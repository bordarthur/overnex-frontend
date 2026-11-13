import { useId, type ReactNode } from 'react';
import { Explicacao } from '../../components/Explicacao';
import { MarcaDagua } from '../../components/MarcaDagua';
import { Pill } from '../../components/Pill';
import { Segmentado } from '../../components/Segmentado';
import { Trechos } from '../../components/Trechos';
import type { Cartao } from '../../contracts/painel';
import { STATUS } from '../../theme/status';
import { useChaveDoCartao } from './consultaPainel';
import './CaixaCartao.css';

interface Props {
  cartao: Cartao;
  /** controle no canto do cabeçalho (ex.: Valor/Volume) */
  controle?: ReactNode;
  /** sem o cabeçalho na tela (o conteúdo já se apresenta); o título fica para o leitor de tela */
  semCabecalho?: boolean;
  children: ReactNode;
}

/** O que todo cartão de painel tem: título, pílula, explicação, subtítulo, legenda, chamada e nota. */
export function CaixaCartao({ cartao, controle, semCabecalho = false, children }: Props) {
  const idTitulo = useId();
  const { legenda = [] } = cartao;
  // filtro da tela que mora neste cartão ("Só lançados" e "Lançados + provisões")
  const chave = useChaveDoCartao(cartao.id);
  return (
    <article className={`card s${cartao.largura}`} aria-labelledby={idTitulo}>
      <div className={semCabecalho ? 'visualmente-oculto' : 'card-h'}>
        <div>
          <div className="card-titulo">
            <h2 id={idTitulo}>
              {cartao.titulo} {cartao.status && <Pill status={cartao.status} />}
            </h2>
            {cartao.explicacao && <Explicacao titulo={cartao.titulo} texto={cartao.explicacao} />}
          </div>
          {cartao.subtitulo && <p className="sub">{cartao.subtitulo}</p>}
        </div>
        {legenda.length > 0 && (
          <div className="legend">
            {legenda.map((l) => (
              <span key={l.nome}>
                <i className={l.marca} aria-hidden="true" />
                {l.nome}
              </span>
            ))}
          </div>
        )}
        {chave && (
          <Segmentado
            rotulo={chave.rotulo}
            opcoes={chave.opcoes}
            valor={chave.valor}
            onMudar={chave.onMudar}
          />
        )}
        {controle}
      </div>
      {children}
      {cartao.chamada && (
        <div className={`callout ${STATUS[cartao.chamada.status].classe}`}>
          <Trechos trechos={cartao.chamada.texto} />
        </div>
      )}
      {cartao.nota && <p className="note">{cartao.nota}</p>}
      <MarcaDagua variante="cartao" />
    </article>
  );
}
