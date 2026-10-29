import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiErro, useApiClient } from '../../api/client';
import { CHAVE_VISAO_GERAL } from '../../api/useVisaoGeral';
import { Segmentado } from '../../components/Segmentado';
import type { SeletorSecao } from '../../contracts/visaoGeral';

/**
 * Escolha da seção que fica salva para o cliente (na Custos, quantas linhas de custo). Grava na API e
 * pede de novo todas as Visões gerais em cache, porque a escolha vale para todos os meses e empresas.
 * Enquanto grava, o botão escolhido já aparece marcado.
 */
interface Props {
  seletor: SeletorSecao;
  /** a empresa escolhida na tela, que vai junto na gravação */
  empresa?: string;
  /** o papel da sessão não pode mudar a escolha (o "leitor"); a API recusaria com 403 */
  soLeitura: boolean;
}

// Recusas com motivo (403, 404, 422): o texto que a API mandou. O resto, uma mensagem genérica.
const mensagemDeErro = (erro: unknown) =>
  erro instanceof ApiErro && [403, 404, 422].includes(erro.status)
    ? erro.message
    : 'Não foi possível salvar a escolha. Tente de novo.';

export function SeletorDaSecao({ seletor, empresa, soLeitura }: Props) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const salvar = useMutation({
    mutationFn: (valor: string) => api.salvarPreferenciaVisaoGeral(seletor.id, valor, { empresa }),
    // devolve a promessa: a gravação só termina quando os números novos chegarem
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE_VISAO_GERAL] }),
  });
  const valor = salvar.isPending ? salvar.variables : seletor.valor;

  return (
    <div className="cmvsel" aria-busy={salvar.isPending}>
      <span className="cmvsel-r">{seletor.rotulo}</span>
      <Segmentado
        rotulo={seletor.rotulo}
        opcoes={seletor.opcoes}
        valor={valor}
        desabilitado={soLeitura}
        onMudar={(v) => {
          if (v !== valor) salvar.mutate(v);
        }}
      />
      <span className="r-sub">{seletor.nota}</span>
      {soLeitura && <span className="r-sub">Seu perfil não pode mudar esta escolha.</span>}
      {salvar.isError && (
        <span className="cmvsel-erro" role="alert">
          {mensagemDeErro(salvar.error)}
        </span>
      )}
    </div>
  );
}
