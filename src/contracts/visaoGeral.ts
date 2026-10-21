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
  // delta com valor 0 aparece como "na média"
  delta: Valor | null;
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

export interface CartaoInadimplencia {
  tipo: 'inadimplencia';
  status: Status;
  percentual: Valor;
  texto: Trecho[];
  nota: string;
  carteira: { rotulo: string; valor: Valor; percentual: number; status: Status }[];
  serie: { rotulos: string[]; valores: number[]; media: number };
}

export interface Secao {
  id: string;
  titulo: string;
  modulo: string | null;
  resumo: string;
  kpis: Kpi[];
  cartoes: CartaoInadimplencia[];
  indicadores: Indicador[];
}

export interface VisaoGeralPayload {
  tela: 'visao-geral';
  versaoContrato: '1.0';
  cliente: { nome: string; sigla: string; logoUrl: string | null };
  // ISO 8601. null até a primeira carga do cliente terminar (nesse caso secoes vem []).
  dadosAte: string | null;
  atualizadoEm: string | null;
  periodos: { id: PeriodoId; rotulo: string }[];
  secoes: Secao[];
}
