// Contrato dos painéis por cartões: Vendas, Equipe comercial, Clientes e atendimentos, Resultado
// e Receber e pagar.
// Hoje escrito à mão; no futuro estes tipos serão gerados do OpenAPI da API.
// Como na Visão geral, o front só desenha: todo número, status, texto, rótulo, média, projeção
// e diferença vem pronto. O front formata os números pela unidade e calcula só geometria
// (largura de barra, escala dos eixos), nunca regra de negócio.

import type { Kpi, Status, Trecho, Unidade, Valor } from './visaoGeral';

export type { Kpi, Status, Trecho, Unidade, Valor };

/** Telas deste contrato. É também o caminho da rota: GET /api/telas/{tela}. */
export type TelaPainel = 'vendas' | 'equipe-comercial' | 'clientes' | 'resultado' | 'receber-pagar';

/** Número a formatar pela unidade, ou texto já pronto quando não é um número só ("2 de 6"). */
export type Exibicao = Valor | string;

/** Número com rótulo: destaques do topo, apoios, estatísticas do mês, colunas dos fatores. */
export interface ItemValor {
  rotulo: string;
  valor: Exibicao;
  contexto?: string;
  status?: Status;
  // "+2,1%" em vez de "2,1%"
  comSinal?: boolean;
}

/** Filtro próprio da tela (Canal, Supervisor...). O valor escolhido vai na consulta: ?{id}={opcao.id}. */
export interface FiltroPainel {
  id: string;
  rotulo: string;
  opcoes: { id: string; rotulo: string }[];
  // id da opção padrão ("todos"); com ela escolhida, o parâmetro não vai na consulta
  padrao: string;
}

export interface Aviso {
  tom: 'info' | 'atencao';
  texto: Trecho[];
}

// ---------- gráficos ----------

/** Unidade dos números de um gráfico (eixo, rótulos e dica). */
export interface Escala {
  unidade: Unidade;
  casas?: number;
  // depois do número: "t", "clientes"
  sufixo?: string;
}

/**
 * Estilo de uma barra. Status (saudavel, atencao, critico) só quando a cor quer dizer status;
 * as séries neutras vão do mais escuro ao mais claro; `fantasma` é contorno tracejado (o que falta
 * fazer) e `projecao`, o mês ainda em curso.
 */
export type EstiloBarra = Status | 'serie' | 'serie-media' | 'serie-clara' | 'fantasma' | 'projecao';

export interface GraficoBarras extends Escala {
  tipo: 'barras';
  grupos: {
    rotulo: string;
    // título da dica; sem ele, o rótulo
    titulo?: string;
    barras: { nome: string; valor: number; estilo: EstiloBarra }[];
  }[];
  // linhas horizontais: `media` cinza tracejada, `minimo` laranja (o necessário)
  referencias?: { nome: string; valor: number; estilo: 'media' | 'minimo' }[];
  // valor escrito em cima de cada barra
  rotulosNasBarras?: boolean;
}

/** Barras contra uma referência (traço sobre a barra) e uma linha percentual em cima. */
export interface GraficoCombo extends Escala {
  tipo: 'combo';
  nomes: { valor: string; referencia?: string; linha?: string };
  pontos: {
    rotulo: string;
    titulo?: string;
    valor: number;
    referencia?: number;
    // crítico pinta a barra de vermelho (mês pior que a referência)
    status?: Status;
    linha?: number;
  }[];
  escalaLinha?: Escala;
}

export type EstiloLinha = 'principal' | 'secundaria' | 'pontilhada';

export interface GraficoLinhas extends Escala {
  tipo: 'linhas';
  rotulos: string[];
  // título da dica de cada ponto; sem ele, o rótulo
  titulos?: string[];
  series: {
    nome: string;
    // null: sem valor naquele ponto (vendedor que ainda não tinha entrado)
    valores: (number | null)[];
    estilo: EstiloLinha;
    area?: boolean;
    // rótulo no fim da linha
    rotuloFim?: string;
  }[];
  // linha tracejada horizontal (a média)
  referencia?: { valor: number; rotulo: string };
  // pontos marcados, com o texto pronto
  marcadores?: { serie: number; i: number; rotulo: string }[];
  // inclui este valor na escala (ex.: 0)
  piso?: number;
}

/**
 * Barras empilhadas; as cores seguem a ordem das séries (até 7). A paleta `atraso` vai do amarelo
 * ao vermelho (faixas de atraso, da mais nova para a mais velha; até 5 séries).
 */
export interface GraficoEmpilhado extends Escala {
  tipo: 'empilhado';
  paleta?: 'series' | 'atraso';
  rotulos: string[];
  series: { nome: string; valores: number[] }[];
}

/**
 * Cascata (da receita ao lucro, do orçado ao realizado). Cada barra vai de `de` a `ate`, já
 * calculados: o front não soma nada. `total` é a barra cheia; `positivo` ajudou, `negativo` atrapalhou.
 */
export interface GraficoCascata extends Escala {
  tipo: 'cascata';
  passos: {
    rotulo: string;
    de: number;
    ate: number;
    valor: number;
    estilo: 'total' | 'positivo' | 'negativo';
  }[];
  // início da escala, para mostrar diferenças pequenas (a ponte do EBITDA começa em 480 mil)
  piso?: number;
}

export interface GraficoDispersao {
  tipo: 'dispersao';
  eixoX: Escala & { rotulo: string };
  eixoY: Escala & { rotulo: string };
  // linhas de corte (medianas), já calculadas
  corteX?: number;
  corteY?: number;
  quadrantes?: {
    posicao: 'superior-esquerdo' | 'superior-direito' | 'inferior-esquerdo' | 'inferior-direito';
    rotulo: string;
  }[];
  pontos: {
    nome: string;
    x: number;
    y: number;
    // área da bolha proporcional a este valor
    tamanho: number;
    status?: Status;
    // escreve o nome ao lado da bolha
    rotular?: boolean;
    dica: ItemValor[];
  }[];
}

/** Acumulado do mês dia a dia, em degraus: plano nos dias sem venda. */
export interface GraficoDegraus extends Escala {
  tipo: 'degraus';
  dias: {
    rotulo: string;
    // "13/10 · ter"
    titulo: string;
    util: boolean;
    // rótulo aparece no eixo (e no celular, só os `eixoCurto`)
    eixo?: boolean;
    eixoCurto?: boolean;
  }[];
  series: {
    nome: string;
    estilo: 'realizado' | 'projecao' | 'meta' | 'supermeta';
    valores: (number | null)[];
    rotuloFim?: string;
    rotuloFimCurto?: string;
  }[];
  hoje?: { indice: number; rotulo: string };
  // traço vermelho no fim: da projeção até a meta
  falta?: { de: number; ate: number };
}

export type Grafico =
  | GraficoBarras
  | GraficoCombo
  | GraficoLinhas
  | GraficoEmpilhado
  | GraficoDispersao
  | GraficoDegraus
  | GraficoCascata;

export type MarcaLegenda =
  'linha' | 'linha-clara' | 'pontilhada' | 'media' | 'minimo' | 'quadrado-escuro' | 'quadrado-claro';

// ---------- cartões ----------

interface CartaoBase {
  id: string;
  // colunas da grade de 12
  largura: 4 | 5 | 6 | 7 | 8 | 12;
  titulo: string;
  subtitulo?: string;
  // pílula de status ao lado do título
  status?: Status;
  legenda?: { nome: string; marca: MarcaLegenda }[];
  // caixa de destaque no fim do cartão
  chamada?: { status: Status; texto: Trecho[] };
  nota?: string;
  // o que o gráfico mostra e como ler, em linguagem simples; com ele, o título ganha o botão "i"
  explicacao?: string;
}

/** Régua do mês, estatísticas do mês e o acumulado dia a dia (com uma visão por unidade: valor, volume). */
export interface CartaoAndamentoMes extends CartaoBase {
  tipo: 'andamento-mes';
  regua: {
    trechos: {
      estilo: 'realizado' | 'projecao' | 'falta';
      rotulo: string;
      de: number;
      ate: number;
      // o número da legenda ("+R$ 4,36 mi")
      valor: Valor;
      comSinal?: boolean;
    }[];
    marcas: { rotulo: string; valor: number; secundaria?: boolean }[];
  };
  estatisticas: ItemValor[];
  visoes: { id: string; rotulo: string; grafico: GraficoDegraus }[];
}

/** Decomposição de um total em fatores (clientes × pedidos × ticket), com o fator que mais pesa marcado. */
export interface CartaoFatores extends CartaoBase {
  tipo: 'fatores';
  total: ItemValor;
  fatores: { nome: string; operador?: string; colunas: ItemValor[]; causa?: boolean }[];
  conclusao?: Trecho[];
}

export interface ItemContraMeta {
  nome: string;
  // "Varejo · novo, 3º mês"
  detalhe?: string;
  status: Status;
  atingimento: Valor;
  realizado: Valor;
  meta: Valor;
  diferenca?: Valor;
  diferencaRuim?: boolean;
  // linha de rodapé do item ("Vendido até hoje R$ 948 mil", "2 vendedores")
  detalhes?: string[];
}

/** Lista de barras contra a meta de cada item: blocos (canais) ou ranking (vendedores). */
export interface CartaoContraMeta extends CartaoBase {
  tipo: 'contra-meta';
  layout: 'blocos' | 'ranking';
  // "Projeção"
  rotuloRealizado: string;
  // "meta", escrito no traço
  rotuloMeta: string;
  itens: ItemContraMeta[];
}

export interface Celula {
  valor?: Exibicao;
  // segunda linha, menor
  sub?: string;
  comSinal?: boolean;
  // ▲ ou ▼ antes do número, pelo sinal
  seta?: boolean;
  // cor do texto
  tom?: Status | 'apagado';
  // fundo de farol
  fundo?: Status;
  // pílula de status; com rótulo, o texto é o da API ("Alta", "Média", "Baixa")
  pill?: Status | { status: Status; rotulo: string };
  negrito?: boolean;
  // etiqueta pequena depois do texto ("rampa")
  etiqueta?: string;
}

export interface CartaoTabela extends CartaoBase {
  tipo: 'tabela';
  // calor: células coloridas e centralizadas (atingimento mês a mês)
  variante?: 'padrao' | 'compacta' | 'calor';
  colunas: { rotulo: string; alinhar?: 'esquerda' | 'direita' | 'centro'; ocultarNoCelular?: boolean }[];
  // status da linha pinta o fundo dela
  linhas: { status?: Status; celulas: Celula[] }[];
  vazio?: string;
}

/** Cartões de destaque lado a lado ("Mais vendas", "Precisa de apoio"). */
export interface CartaoDestaques extends CartaoBase {
  tipo: 'destaques';
  itens: { categoria: string; titulo: string; texto: string; status: Status }[];
}

/** Um ou mais gráficos lado a lado, cada um com título e nota opcionais. */
export interface CartaoGraficos extends CartaoBase {
  tipo: 'graficos';
  // gráficos por linha quando há mais de um (padrão 2)
  colunas?: 2 | 3;
  graficos: { titulo?: string; nota?: string; grafico: Grafico }[];
}

/** Pares de barras por faixa (participação nos atendimentos e na receita). */
export interface CartaoFaixas extends CartaoBase {
  tipo: 'faixas';
  // as duas séries, na ordem das barras (a primeira clara, a segunda escura)
  series: [string, string];
  linhas: { rotulo: string; valores: [number, number] }[];
  escala: Escala;
}

export interface CartaoCurvaAbc extends CartaoBase {
  tipo: 'curva-abc';
  classes: {
    rotulo: string;
    acao: string;
    quantidade: Exibicao;
    textos: Trecho[][];
    // sem status: borda neutra
    status?: Status;
  }[];
  grafico: GraficoLinhas;
  notaGrafico?: string;
}

/** Matriz de contagens (curva de receita × curva de margem). */
export interface CartaoMatriz extends CartaoBase {
  tipo: 'matriz';
  linhas: string[];
  colunas: string[];
  // status pinta a célula; sem ele, cinza na intensidade do valor
  valores: { valor: number; status?: Status }[][];
}

export interface LinhaDre {
  id: string;
  // código da conta no plano ("100.01"); subtotais não têm
  codigo?: string;
  nome: string;
  // 0 = subtotal (Receita líquida, Lucro bruto...); 1 a 3 = níveis do plano de contas
  nivel: 0 | 1 | 2 | 3;
  // id da linha de cima na árvore
  pai?: string;
  // a última linha (Lucro líquido final), em destaque escuro
  final?: boolean;
  realizado: number;
  percentualReceitaBruta: number;
  comparacao: number;
  diferenca: number;
  diferencaPercentual: number | null;
  // cor do texto da diferença (melhor ou pior que a comparação)
  tomDiferenca?: Status;
  // fundo de farol na diferença (desvio grande)
  destacarDiferenca?: boolean;
  status: Status;
  // esta linha ou alguma abaixo dela fora de "saudavel": é o que fica com "Só desvios"
  comDesvio: boolean;
  // últimos 6 meses
  tendencia: { realizado: number[]; comparacao: number[] };
}

/** DRE em árvore: abre por nível, filtra os desvios e mostra a tendência de cada conta. */
export interface CartaoDre extends CartaoBase {
  tipo: 'dre';
  // cabeçalho da primeira coluna ("Conta (R$ mil)") e da comparação ("Orçado", "Agosto")
  rotuloConta: string;
  rotuloComparacao: string;
  escala: Escala;
  nivelInicial: 1 | 2 | 3;
  // níveis que a chave oferece
  niveis: (1 | 2 | 3)[];
  // na ordem de exibição, com os subtotais
  linhas: LinhaDre[];
  rodape?: string[];
}

/** Uma barra dividida em partes (ponto de equilíbrio e folga), com a escala e um texto. */
export interface CartaoBarraPartes extends CartaoBase {
  tipo: 'barra-partes';
  // proporções somam 1
  partes: { rotulo: string; proporcao: number; estilo: 'serie-clara' | Status }[];
  escala: { inicio: string; fim: string };
  texto?: Trecho[];
}

/** Grupos de contas com o desvio de cada uma (pioram e melhoram o resultado). */
export interface CartaoDesvios extends CartaoBase {
  tipo: 'desvios';
  escala: Escala;
  grupos: { titulo: string; status: Status; itens: { nome: string; detalhe?: string; valor: number }[] }[];
}

/** Janelas de dias lado a lado (próximos 7, 15 e 30 dias), com um alerta opcional ao fim. */
export interface CartaoJanelas extends CartaoBase {
  tipo: 'janelas';
  janelas: {
    titulo: string;
    status?: Status;
    linhas: {
      rotulo: string;
      valor: Valor;
      tom?: Status;
      comSinal?: boolean;
      // total: com linha em cima; saldo: com o fundo do status da janela
      tipo?: 'total' | 'saldo';
    }[];
  }[];
  alerta?: { etiqueta: string; texto: Trecho[]; rodape?: string };
}

/** Os dois lados de uma visão (contas a receber × contas a pagar). */
export interface CartaoDoisLados extends CartaoBase {
  tipo: 'dois-lados';
  lados: {
    titulo: string;
    // "em aberto: R$ 7,13 mi"
    total: string;
    // etiqueta de qualidade do dado ao lado do total
    alerta?: string;
    kpis: Kpi[];
    // faixas de idade dos títulos; participacao em % do total do lado
    idade: { rotulo: string; valor: Valor; participacao: number; status?: Status }[];
    observacao?: Trecho[];
    maiores: { nome: string; valor: Valor; participacao: number; etiqueta?: string }[];
  }[];
}

/** Lista de barras horizontais (a pagar por semana); a maior ocupa a largura toda. */
export interface CartaoBarrasHorizontais extends CartaoBase {
  tipo: 'barras-horizontais';
  escala: Escala;
  itens: { rotulo: string; sub?: string; valor: number; status?: Status }[];
}

export type Cartao =
  | CartaoAndamentoMes
  | CartaoFatores
  | CartaoContraMeta
  | CartaoTabela
  | CartaoDestaques
  | CartaoGraficos
  | CartaoFaixas
  | CartaoCurvaAbc
  | CartaoMatriz
  | CartaoDre
  | CartaoBarraPartes
  | CartaoDesvios
  | CartaoJanelas
  | CartaoDoisLados
  | CartaoBarrasHorizontais;

export interface PainelPayload {
  tela: TelaPainel;
  versaoContrato: '1.0';
  cliente: { nome: string; sigla: string; logoUrl: string | null };
  // ISO 8601. null até a primeira carga do cliente terminar (nesse caso não vem cartão)
  dadosAte: string | null;
  atualizadoEm: string | null;
  filtros: FiltroPainel[];
  aviso?: Aviso;
  // números grandes do topo (até 3)
  destaques: ItemValor[];
  // linha de KPIs (no lugar dos destaques, em Clientes)
  kpis: Kpi[];
  apoios: ItemValor[];
  cartoes: Cartao[];
}
