// Contrato da tela Visão geral.
// Hoje escrito à mão; no futuro estes tipos serão gerados do OpenAPI da API.
// O front só desenha o que vem aqui: nenhum cálculo de negócio, nenhum nome de seção ou indicador fixo.

export type Status = 'saudavel' | 'atencao' | 'critico';
export type PeriodoId = 'mes' | 'ano';
export type Unidade = 'brl' | 'pct' | 'pp' | 'dias' | 'vezes' | 'qtd';

export interface Valor {
  valor: number;
  unidade: Unidade;
  casas?: number;
  // brl compacto (padrão true): R$ 6,54 mi / R$ 360 mil; brl cheio: R$ 2.995
  compacto?: boolean;
  // brl compacto em milhares com casas (R$ 54,7 mil); sem ele, milhares saem inteiros
  casasMil?: number;
  // sufixo, por exemplo para qtd: "clientes", "linhas"
  sufixo?: string;
}

export interface Trecho {
  texto: string;
  destaque?: boolean;
}

export interface Kpi {
  rotulo: string;
  valor: Valor;
  contexto: string;
  status?: Status;
}

export interface Faixa {
  de: number;
  ate: number;
  status: Status;
}

export interface IndicadorPeriodo {
  status: Status;
  valor: Valor;
  // posição no velocímetro, na escala do gauge
  ponteiro: number;
  // delta com valor 0 aparece como "na média"; em texto, vai como veio ("na meta")
  delta: Valor | string | null;
  deltaRuim: boolean;
  referencia: string;
}

export interface Indicador {
  id: string;
  nome: string;
  telaDestino?: string;
  origem: 'dw' | 'cadastro';
  gauge: { min: number; max: number; meta: number; unidade: Unidade; faixas: Faixa[] };
  periodos: Record<PeriodoId, IndicadorPeriodo>;
  tendencia: {
    rotulos: string[];
    real: number[];
    referencia: number[];
    faixa?: [number, number];
    unidade: Unidade;
    casas?: number;
  };
}

/** O que todo cartão de seção tem no cabeçalho. */
interface CabecalhoCartao {
  titulo: string;
  subtitulo: string;
  // texto do botão "i"; sem ele, o botão não aparece
  explicacao?: string | null;
}

export interface CartaoInadimplencia extends Partial<CabecalhoCartao> {
  tipo: 'inadimplencia';
  status: Status;
  percentual: Valor;
  texto: Trecho[];
  nota: string;
  // soNaBarra: a faixa fica só na barra, com o rótulo dentro, sem quadro embaixo (o a vencer)
  carteira: { rotulo: string; valor: Valor; percentual: number; status: Status; soNaBarra?: boolean }[];
  serie: { rotulos: string[]; valores: number[]; media: number };
}

/** Valor com o rótulo que vai ao lado dele no gráfico ("lançado", "média paga R$ 6,31 mi"). */
export interface ValorRotulado {
  valor: Valor;
  rotulo: string;
}

/** Um modo do seletor do cartão de próximos dias ("Só o lançado", "Com a projeção"). */
export interface ModoProximosDias {
  id: string;
  rotulo: string;
  // true: completa o a pagar com o que falta lançar
  comFalta: boolean;
  // true: completa o a receber com as vendas novas
  comNovas?: boolean;
  status: Status | null;
}

export interface JanelaProximosDias {
  titulo: string;
  // "até 19/10"
  ate: string;
  receber: Valor;
  pagar: Valor;
  // o que falta lançar para chegar à média paga, proporcional aos dias
  falta: Valor;
  // vendas novas para chegar à média recebida, proporcional aos dias
  novas?: Valor | null;
  // onde o caixa termina em cada modo (pelo id do modo): valor, status e o texto embaixo do valor
  fim: Record<string, { valor: Valor; status: Status | null; texto: string }>;
}

/**
 * Próximos 7, 15 e 30 dias: saldo de hoje (quando houver), mais o que vence a receber, menos o que
 * vence a pagar. Sem saldo, a barra começa em zero e o fim é a sobra ou a falta da janela.
 */
export interface CartaoProximosDias extends CabecalhoCartao {
  tipo: 'proximos-dias';
  nota: string;
  // o primeiro é o padrão
  modos: ModoProximosDias[];
  legenda: { saldo: string | null; receber: string; novas?: string | null; pagar: string; falta: string };
  saldo: Valor | null;
  // caixa mínimo da empresa: a linha tracejada ("caixa mínimo R$ 500 mil")
  minimo: { valor: number; rotulo: string } | null;
  janelas: JanelaProximosDias[];
}

/** Um grupo de pagamento: o que foi pago por mês e o que está lançado para os próximos dias. */
export interface GrupoPagar {
  nome: string;
  // null: grupo sem farol (capex oscila muito para tratar o que falta como falta)
  status: Status | null;
  percentual: Valor;
  // ao lado do percentual: "lançado; falta R$ 1,04 mi"
  texto: string;
  pagos: { rotulo: string; valor: Valor }[];
  media: ValorRotulado;
  proximos: { rotulo: string; lancado: ValorRotulado; falta: ValorRotulado };
  // embaixo do gráfico do grupo
  nota: string | null;
}

/** O que já está lançado a pagar nos próximos dias, contra o que a empresa pagou por mês, por grupo. */
export interface CartaoPagarLancado extends CabecalhoCartao {
  tipo: 'pagar-lancado';
  status: Status;
  percentual: Valor;
  // o texto ao lado do número grande
  texto: string;
  // embaixo do texto: quanto falta e em quais grupos
  nota: string;
  // acima dos grupos ("Por grupo de pagamento")
  rotuloGrupos: string;
  grupos: GrupoPagar[];
}

/** Quantos dias o saldo de hoje paga, se nada entrar: a régua de dias e os últimos meses. */
export interface CartaoCobertura extends CabecalhoCartao {
  tipo: 'cobertura';
  status: Status;
  dias: Valor;
  texto: Trecho[];
  nota: string;
  // um quadrado por dia: os cobertos preenchidos e, até a referência, contornados
  regua: {
    total: number;
    cobertos: number;
    referencia: number;
    rotuloCobertos: string;
    rotuloReferencia: string;
    // datas nas pontas ("12/10", "11/11")
    inicio: string;
    fim: string;
  };
  // o último valor é o de hoje
  serie: { titulo: string; rotulos: string[]; valores: number[]; media: { valor: number; rotulo: string } };
}

export type CartaoSecao = CartaoInadimplencia | CartaoProximosDias | CartaoPagarLancado | CartaoCobertura;

/**
 * Escolha que fica salva para o cliente e muda o que a seção mostra (na Custos: quantas linhas de
 * custo viram velocímetro). Trocar grava em PUT /api/telas/visao-geral/preferencias/{id}.
 */
export interface SeletorSecao {
  id: string;
  rotulo: string;
  opcoes: { id: string; rotulo: string }[];
  valor: string;
  nota: string;
}

export interface Secao {
  id: string;
  titulo: string;
  modulo: string | null;
  resumo: string;
  kpis: Kpi[];
  seletor?: SeletorSecao | null;
  cartoes: CartaoSecao[];
  indicadores: Indicador[];
}

export interface VisaoGeralPayload {
  tela: 'visao-geral';
  versaoContrato: '1.0';
  cliente: { nome: string; sigla: string; logoUrl: string | null };
  // ISO 8601. null até a primeira carga do cliente terminar (nesse caso secoes vem []).
  dadosAte: string | null;
  atualizadoEm: string | null;
  // a chave de cada velocímetro ("Mês", "Acumulado"); o primeiro é o padrão
  periodos: { id: PeriodoId; rotulo: string }[];
  // a nota no topo da tela, sobre como os cartões comparam
  nota?: string | null;
  secoes: Secao[];
}
