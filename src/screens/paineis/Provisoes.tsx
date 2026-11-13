import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type KeyboardEvent } from 'react';
import { ApiErro, useApiClient } from '../../api/client';
import { CHAVE_PAINEL } from '../../api/usePainel';
import { Chave } from '../../components/Chave';
import { Segmentado } from '../../components/Segmentado';
import type { CartaoProvisoes, LinhaProvisao } from '../../contracts/painel';
import { formatarValor } from '../../format';
import { CaixaCartao } from './CaixaCartao';
import { lerCampo, paraCampo } from './campoMil';
import { useConsultaPainel } from './consultaPainel';
import './Provisoes.css';

type Mudanca =
  | { tipo: 'periodo'; periodo: string }
  | { tipo: 'grupo'; grupo: string; ligado: boolean; valor: number | null };

const brl = (valor: number) => formatarValor({ valor, unidade: 'brl' });

/**
 * Provisões pelo histórico: período da média, chave de cada grupo e o valor usado. Cada mudança vai
 * para a API (que grava para o cliente e recalcula); depois, a tela é pedida de novo. O front não
 * recalcula nada: enquanto a API responde, os controles ficam parados.
 */
export function Provisoes({ cartao }: { cartao: CartaoProvisoes }) {
  const consulta = useConsultaPainel();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const salvar = useMutation({
    mutationFn: async (m: Mudanca) => {
      if (!consulta) return;
      const empresa = { empresa: consulta.filtros.empresa };
      if (m.tipo === 'periodo')
        await api.salvarPeriodoProvisoes(
          consulta.cliente,
          consulta.tela,
          cartao.id,
          { periodo: m.periodo },
          empresa,
        );
      else
        await api.salvarGrupoProvisao(
          consulta.cliente,
          consulta.tela,
          cartao.id,
          m.grupo,
          { ligado: m.ligado, valor: m.valor },
          empresa,
        );
    },
    // a tela inteira muda (saldo, semanas, de onde vem): pede de novo, com qualquer filtro
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CHAVE_PAINEL, consulta?.cliente, consulta?.tela] }),
  });
  const parado = !cartao.editavel || !consulta || salvar.isPending;
  const { colunas } = cartao;

  const mudarGrupo = (g: LinhaProvisao, mudanca: { ligado?: boolean; valor?: number | null }) =>
    salvar.mutate({
      tipo: 'grupo',
      grupo: g.id,
      ligado: mudanca.ligado ?? g.ligado,
      // sem personalização, o valor continua vazio (o sugerido acompanha a média)
      valor: mudanca.valor !== undefined ? mudanca.valor : g.personalizado ? g.usado : null,
    });

  return (
    <CaixaCartao
      cartao={cartao}
      controle={
        <Segmentado
          rotulo="Período da média"
          opcoes={cartao.periodos}
          valor={cartao.periodo}
          desabilitado={parado}
          onMudar={(periodo) => {
            if (periodo !== cartao.periodo) salvar.mutate({ tipo: 'periodo', periodo });
          }}
        />
      }
    >
      <div className="scroll-x">
        <table className="tbl prov-tbl">
          <thead>
            <tr>
              <th scope="col" className="l">
                {colunas.usar}
              </th>
              <th scope="col" className="l">
                {colunas.grupo}
              </th>
              <th scope="col" className="so-largo">
                {colunas.media}
              </th>
              <th scope="col" className="so-largo">
                {colunas.lancado}
              </th>
              <th scope="col" className="so-largo">
                {colunas.sugerida}
              </th>
              <th scope="col">{colunas.usado}</th>
            </tr>
          </thead>
          <tbody>
            {cartao.grupos.map((g) => (
              <tr key={g.id} className={g.ligado ? undefined : 'desligado'}>
                <td className="l">
                  <Chave
                    rotulo={`${colunas.usar}: ${g.nome}`}
                    ocultarRotulo
                    ligada={g.ligado}
                    desabilitada={parado}
                    onMudar={(ligado) => mudarGrupo(g, { ligado })}
                  />
                </td>
                <td className="l prov-nome">
                  {g.nome}
                  {g.detalhe && <span className="r-sub cel-sub">{g.detalhe}</span>}
                </td>
                <td className="so-largo">{brl(g.media)}</td>
                <td className="so-largo">{g.lancado == null ? '–' : brl(g.lancado)}</td>
                <td className="forte so-largo">{brl(g.sugerida)}</td>
                <td>
                  <CampoValor
                    key={`${g.usado}-${g.personalizado ?? ''}`}
                    grupo={g}
                    rotulo={`${colunas.usado}: ${g.nome}, em milhares de reais`}
                    desabilitado={parado || !g.ligado}
                    onSalvar={(valor) => mudarGrupo(g, { valor })}
                  />
                  {g.personalizado && <span className="r-sub cel-sub prov-quem">{g.personalizado}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {salvar.isPending && (
        <p className="prov-estado" role="status">
          Salvando e recalculando a projeção…
        </p>
      )}
      {salvar.isError && (
        <p className="prov-estado prov-erro" role="alert">
          Não deu para salvar:{' '}
          {salvar.error instanceof ApiErro ? salvar.error.message : 'tente de novo em instantes.'}
        </p>
      )}
    </CaixaCartao>
  );
}

interface PropsCampo {
  grupo: LinhaProvisao;
  rotulo: string;
  desabilitado: boolean;
  // reais; null volta ao sugerido
  onSalvar: (valor: number | null) => void;
}

/** Campo do valor usado, em milhares. Grava ao sair do campo ou com Enter; Esc desfaz; vazio volta ao sugerido. */
function CampoValor({ grupo, rotulo, desabilitado, onSalvar }: PropsCampo) {
  const inicial = paraCampo(grupo.usado);
  const [texto, setTexto] = useState(inicial);
  const [invalido, setInvalido] = useState(false);

  const confirmar = () => {
    if (texto === inicial) return setInvalido(false);
    if (texto.trim() === '') {
      setInvalido(false);
      if (grupo.personalizado) onSalvar(null);
      else setTexto(inicial);
      return;
    }
    const valor = lerCampo(texto);
    if (valor == null) return setInvalido(true);
    setInvalido(false);
    if (valor === grupo.usado) setTexto(inicial);
    else onSalvar(valor);
  };
  const teclas = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') {
      setTexto(inicial);
      setInvalido(false);
    }
  };

  return (
    <span className="prov-campo">
      <span className="prov-entrada">
        <input
          type="text"
          inputMode="decimal"
          aria-label={rotulo}
          aria-invalid={invalido || undefined}
          value={texto}
          disabled={desabilitado}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={teclas}
        />
        <span aria-hidden="true">mil</span>
      </span>
      {invalido && (
        <span className="prov-invalido" role="alert">
          Digite um número em mil, zero ou mais.
        </span>
      )}
    </span>
  );
}
