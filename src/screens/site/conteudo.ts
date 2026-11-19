import type { Status } from '../../contracts/visaoGeral';

/**
 * Todos os textos do site institucional (mockup overnex-site-w2_0_0, W2.0.0, a partir do "Roteiro do
 * site Overnex v2.1 - rev26.11.16"). O contato é provisório: trocar aqui e no index.html (noscript e
 * JSON-LD).
 *
 * Os números são ilustrativos, do Cliente Demo, e não vêm da API: o site é público e não fala com ela.
 */
export const CONTEUDO = {
  contato: {
    whatsapp: '5585997440016',
    whatsappRotulo: '(85) 99744-0016',
    mensagem: 'Olá! Quero ver uma demonstração da Overnex.',
    email: 'nuno.alvares@overnex.app',
    emailAssunto: 'Demonstração Overnex',
  },
  chamada: 'Agendar uma demonstração',
  chamadaCurta: 'Agendar demonstração',
  nav: {
    links: [
      ['Como funciona', '#como-funciona'],
      ['O que você vê', '#o-que-voce-ve'],
      ['Segurança', '#seguranca'],
      ['Quem faz', '#quem-faz'],
    ],
    entrar: 'Entrar',
  },
  hero: {
    assinatura: 'Seu farol de decisões',
    titulo: 'Veja para onde sua empresa está indo. Antes do fim do mês.',
    sub: 'Vendas, caixa, resultado e equipe num lugar só, atualizados todo dia, comparados com a sua meta. Você decide; a Overnex ilumina o caminho.',
    secundario: ['Ver como funciona ↓', '#farol'],
    cartao: {
      nome: 'Vendas contra a meta',
      status: 'atencao' as Status,
      pct: 94.8,
      projecao: 'R$ 6,54 mi',
      meta: 'R$ 6,90 mi',
      frase: 'Para bater a meta, venda R$ 337 mil por dia útil.',
      rodape: ['Cliente Demo', 'dia útil 13 de 22'],
    },
  },
  problema: {
    sobretitulo: 'Foco no retrovisor',
    titulo: 'O relatório chega no dia 10 contando o que já passou.',
    texto:
      'A maioria das empresas decide olhando para trás: fechamento atrasado, planilha que só uma pessoa entende, número diferente em cada sistema.',
    dores: [
      [
        'Informação demais, clareza de menos.',
        'Relatórios longos, planilhas paralelas e nenhuma resposta clara para a pergunta do dia.',
      ],
      [
        'Cada sistema conta uma história diferente.',
        'O financeiro diz uma coisa, o comercial outra. A reunião vira debate sobre qual número está certo.',
      ],
      [
        'Quando o problema aparece, já virou prejuízo.',
        'O mês fechou, a meta ficou para trás e só resta explicar o que aconteceu.',
      ],
    ],
  },
  farol: {
    sobretitulo: 'O farol futuro',
    titulo: 'Não é sobre o que aconteceu. É sobre para onde você está indo.',
    texto:
      'Arraste o dia do mês e veja o que a Overnex mostra todos os dias: o ritmo de hoje, onde ele leva e quanto falta para chegar lá.',
    controle: 'Dia do mês',
    legenda:
      'Projeção por dia útil, com o calendário da sua empresa (sábados e feriados inclusos). Números ilustrativos do Cliente Demo.',
    // R$ mil
    meta: 6900,
    diasUteis: 22,
    inicio: 13,
    // R$ mil por dia útil
    vendas: [
      318, 352, 327, 341, 312, 289, 262, 281, 270, 294, 258, 283, 277.5, 262, 241, 255, 236, 259, 247, 244,
      262, 244,
    ],
  },
  como: {
    sobretitulo: 'Como funciona',
    titulo: 'Você não monta nada.',
    passos: [
      [
        'A gente conecta.',
        'A equipe BORD liga a Overnex aos sistemas que você já usa e organiza seu plano de contas no padrão.',
      ],
      ['Todo dia, às 9h, está pronto.', 'Os números chegam calculados e comparados com a meta.'],
      ['Você decide.', 'Abre, vê o que está azul, amarelo e vermelho, e age primeiro onde importa.'],
    ],
    nota: 'Sem planilha para alimentar, sem painel para montar.',
  },
  setores: {
    sobretitulo: 'O que você enxerga',
    titulo: 'A empresa inteira, do ponto de vista do dono.',
    abas: [
      {
        id: 'geral',
        nome: 'Visão geral',
        perguntas: [
          'Como está a empresa hoje, área por área?',
          'O que precisa de atenção primeiro?',
          'O que melhorou e o que piorou desde ontem?',
        ],
      },
      {
        id: 'comercial',
        nome: 'Comercial',
        perguntas: [
          'Vou bater a meta do mês?',
          'Quem da equipe está acima do ritmo?',
          'Quantos clientes compraram?',
        ],
      },
      {
        id: 'financeiro',
        nome: 'Financeiro',
        perguntas: [
          'Quanto entra e sai nos próximos 30, 60 dias?',
          'Quanto está vencido?',
          'O resultado está dentro do orçado?',
        ],
      },
      {
        id: 'pessoas',
        nome: 'Pessoas',
        perguntas: [
          'Quanto custa a equipe?',
          'Como esse custo evolui mês a mês?',
          'Quanto ele pesa sobre a receita?',
        ],
        nota: 'Nomes e salários só para quem você autorizar.',
      },
      {
        id: 'operacao',
        nome: 'Operação',
        perguntas: [
          'Quanto tempo meu estoque aguenta?',
          'Estou perdendo venda por falta de produto?',
          'Quais produtos mais vendem e quais param na prateleira?',
        ],
        nota: 'Conforme o seu segmento.',
      },
    ],
  },
  linguagem: {
    sobretitulo: 'A linguagem do farol',
    titulo: 'Três cores. Nenhuma dúvida.',
    cores: [
      {
        status: 'saudavel' as Status,
        nome: 'Azul',
        diz: 'Saudável. Siga em frente.',
        cartao: {
          nome: 'Clientes atendidos',
          valor: '1.152',
          delta: '▲ +32',
          referencia: 'projeção contra meta de 1.120',
          serie: [1060, 1085, 1090, 1110, 1124, 1138],
          linhaReferencia: 1120,
          projecao: 1152,
        },
      },
      {
        status: 'atencao' as Status,
        nome: 'Amarelo',
        diz: 'Atenção. Ainda dá tempo de corrigir.',
        cartao: {
          nome: 'Vendas contra a meta',
          valor: '94,8%',
          delta: '▼ −R$ 360 mil',
          referencia: 'projeção de R$ 6,54 mi contra meta de R$ 6,90 mi',
          serie: [101, 103, 99, 98, 97, 96],
          linhaReferencia: 100,
          projecao: 94.8,
        },
      },
      {
        status: 'critico' as Status,
        nome: 'Vermelho',
        diz: 'Crítico. Comece por aqui.',
        cartao: {
          nome: 'Vencido a receber',
          valor: 'R$ 412 mil',
          delta: '▲ +R$ 96 mil',
          referencia: 'acima do limite de R$ 250 mil',
          serie: [210, 230, 260, 290, 316, 360],
          linhaReferencia: 250,
          projecao: 412,
        },
      },
    ],
    frase: 'Cada indicador mostra a história e a tendência: de onde veio, onde está e para onde vai.',
    // o botão "i" fica entre as duas partes
    nota: ['Tem dúvida num gráfico? O botão', 'explica em uma frase.'],
    demo: 'Cartões com números ilustrativos do Cliente Demo.',
  },
  diferenciais: {
    sobretitulo: 'Por que não é só mais um painel',
    titulo: 'Painel qualquer um faz. Direção, não.',
    texto:
      'Hoje dá para montar um painel em minutos, até com IA. Mas um painel montado é um retrato. A Overnex é um farol vivo.',
    itens: [
      ['Vivo, não retrato.', 'Atualizado todo dia, sem ninguém refazer nada.'],
      ['Seus sistemas, uma verdade.', 'Dados de sistemas diferentes, organizados num padrão único.'],
      [
        'Leitura de quem é CFO.',
        'O que mostrar e como mostrar vem de anos de assessoria financeira da BORD, para não induzir a decisão errada.',
      ],
      [
        'Seguro e previsível.',
        'Sem senha do seu sistema circulando em arquivo, sem conta de IA crescendo sem aviso.',
      ],
    ],
  },
  seguranca: {
    sobretitulo: 'Segurança',
    titulo: 'Seus números são só seus.',
    // Só o que já vale (decisão de 19/11/2026). "Armazenados": o banco é o Supabase de São Paulo e a
    // API fica em Brazil South; o Cloudflare só repassa. "Tratamento conforme a LGPD" volta quando a
    // política de privacidade completa estiver publicada.
    itens: [
      'Acesso só por convite da sua empresa. Ninguém se cadastra sozinho.',
      'Cada pessoa vê apenas a empresa e as áreas que você liberar.',
      'Sessão que expira sozinha.',
      'Dados armazenados no Brasil.',
    ],
  },
  quemFaz: {
    sobretitulo: 'Um produto BORD',
    titulo: 'Nasceu dentro de uma assessoria de CFO.',
    texto:
      'A Overnex nasceu da BORD, que acompanha o financeiro de empresas como CFO as a service. Tudo o que está na tela é o que a BORD já usa todo dia para orientar seus clientes.',
    // Números reais da BORD: enquanto estiverem null, o bloco não aparece
    numeros: [
      [null, 'anos de mercado'],
      [null, 'empresas acompanhadas'],
      [null, 'em faturamento acompanhado'],
    ] as [string | null, string][],
    manifesto: ['Não acreditamos em sorte.', 'Acreditamos em dados que iluminam o caminho.'],
  },
  faq: {
    sobretitulo: 'Perguntas frequentes',
    titulo: 'Antes de conversar.',
    itens: [
      { pergunta: 'Preciso trocar meu sistema?', resposta: 'Não. A Overnex lê os sistemas que você já usa.' },
      // falta o prazo médio de implantação (ver TODO.md, "A decidir")
      {
        pergunta: 'Quanto tempo para começar?',
        resposta: 'Depende dos seus sistemas. Na conversa a gente estima.',
      },
      { pergunta: 'Com que frequência os números atualizam?', resposta: 'Todo dia, pela manhã.' },
      {
        pergunta: 'Quem da minha equipe pode ver?',
        resposta: 'Você decide, pessoa por pessoa e área por área.',
      },
      {
        pergunta: 'Funciona para mais de uma empresa?',
        resposta: 'Sim. Você acompanha cada empresa e o grupo inteiro.',
        // só se o desenho #18267 estiver construído até a S5
        mostrar: false,
      },
      {
        pergunta: 'Quanto custa?',
        resposta: 'Depende do porte e dos sistemas. Na demonstração a gente apresenta a proposta.',
      },
      {
        pergunta: 'Substitui meu contador ou consultor?',
        resposta:
          'Não. A gente não decide por você: garante que você tenha a melhor informação para decidir.',
      },
    ] as { pergunta: string; resposta: string; mostrar?: boolean }[],
  },
  final: {
    titulo: 'Decisão sem dados é chute.',
    sub: 'Veja a Overnex funcionando com números de uma empresa como a sua.',
    alternativa: 'ou escreva para',
  },
  rodape: {
    assinatura: 'Seu farol de decisões · Um produto BORD',
    copy: '© 2026 Overnex · overnex.app',
    versao: 'Site W2.0.0',
  },
  privacidade: {
    titulo: 'Política de privacidade',
    lede: 'Como a Overnex coleta, usa e protege os seus dados, em conformidade com a LGPD (Lei nº 13.709/2018).',
    // o texto completo da política ainda não chegou (ver TODO.md, "A decidir")
    texto:
      'Esta página está sendo atualizada com a versão completa da nossa política. Enquanto isso, se tiver qualquer dúvida sobre como tratamos os seus dados, fale com a gente pelo e-mail abaixo.',
    contatoTitulo: 'Fale com a gente',
    contatoTexto: 'Dúvidas sobre os seus dados:',
    rodape: '© 2026 Overnex · overnex.app · Um produto BORD',
  },
};

export type Conteudo = typeof CONTEUDO;

export const linkWhatsApp = ({ contato }: Conteudo) =>
  `https://wa.me/${contato.whatsapp}?text=${encodeURIComponent(contato.mensagem)}`;

export const linkEmail = ({ contato }: Conteudo) =>
  `mailto:${contato.email}?subject=${encodeURIComponent(contato.emailAssunto)}`;
