import {
  UserProfile,
  FiscalObligation,
  AlertItem,
  Client,
  LegalDoc,
  NewsItem,
  SimulationRecord,
  SystemSettings
} from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr_carlos_apollo',
  name: 'Carlos Apollo',
  email: 'carlos.apollo@claq.co.mz',
  phone: '+258 84 123 4567',
  role: 'Contabilista / Administrador',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  companyName: 'CLAQ Consultores, Lda',
  companyNuit: '400889900',
  companyAddress: 'Av. 24 de Julho, Edifício Platinum, 5º Andar',
  companyCity: 'Maputo',
  companyProvince: 'Maputo Cidade',
  plan: 'PME',
  planStatus: 'active',
  renewalDate: '15/12/2026'
};

export const INITIAL_SETTINGS: SystemSettings = {
  notifications: {
    email: true,
    whatsapp: true,
    inApp: true,
    sms: false
  },
  alertTiming: {
    d7: true,
    d3: true,
    d1: true,
    d0: true
  },
  whatsappNumber: '+258 84 123 4567',
  isWhatsAppConnected: true,
  theme: 'light',
  language: 'pt-PT'
};

export const INITIAL_OBLIGATIONS: FiscalObligation[] = [
  {
    id: 'obl-iva-jun26',
    title: 'IVA – Declaração e Pagamento',
    category: 'IVA',
    period: 'Junho/2026',
    dueDate: '2026-06-30',
    status: 'a_vencer',
    amount: 127500,
    authority: 'AT',
    description: 'Declaração periódica do Modelo A e guia de pagamento do IVA relativo às operações de Junho.',
    penaltyRisk: 'Multa de 25% a 100% mais juros de mora legais (Art. 101 LGT).',
    daysRemaining: 3
  },
  {
    id: 'obl-inss-jun26',
    title: 'INSS – Contribuição Mensal',
    category: 'INSS',
    period: 'Junho/2026',
    dueDate: '2026-07-10',
    status: 'a_vencer',
    amount: 45230,
    authority: 'INSS',
    description: 'Folha de salários e pagamento de 3% trabalhador + 4% patronal.',
    penaltyRisk: 'Juros de mora mensais e certidão de quitação bloqueada.',
    daysRemaining: 8
  },
  {
    id: 'obl-tae-2026',
    title: 'TAE – Taxa de Atividade Económica',
    category: 'TAE',
    period: '1º Semestre/2026',
    dueDate: '2026-07-20',
    status: 'pendente',
    amount: 12000,
    authority: 'Municipio',
    description: 'Obrigação municipal. Consulte a tabela do seu município (Conselho Municipal de Maputo).',
    penaltyRisk: 'Agravamento de 50% por incumprimento do prazo municipal.',
    daysRemaining: 20
  },
  {
    id: 'obl-alvara-2026',
    title: 'Alvará Comercial',
    category: 'Alvara',
    period: 'Renovação Anual 2026',
    dueDate: '2026-08-15',
    status: 'a_renovar',
    amount: 8500,
    authority: 'BAU',
    description: 'Renove o seu alvará para evitar penalizações e encerramento preventivo.',
    penaltyRisk: 'Suspensão da licença de exercício comercial.',
    daysRemaining: 45
  },
  {
    id: 'obl-irps-jun26',
    title: 'IRPS – Retenções na Fonte (Trabalho Dependente)',
    category: 'IRPS',
    period: 'Junho/2026',
    dueDate: '2026-07-20',
    status: 'pendente',
    amount: 37500,
    authority: 'AT',
    description: 'Guia de retenção na fonte sobre remunerações de colaboradores auferidas em Junho.',
    penaltyRisk: 'Multa e responsabilidade subsidiária da entidade patronal.',
    daysRemaining: 20
  },
  {
    id: 'obl-irpc-m22',
    title: 'IRPC – Declaração Anual Modelo 22',
    category: 'IRPC',
    period: 'Exercício Fiscal 2025',
    dueDate: '2026-06-30',
    status: 'pago',
    amount: 185000,
    authority: 'AT',
    description: 'Apresentação da declaração anual de rendimentos e autoliquidação do IRPC.',
    daysRemaining: 0
  },
  {
    id: 'obl-iva-mai26',
    title: 'IVA – Declaração e Pagamento (Maio)',
    category: 'IVA',
    period: 'Maio/2026',
    dueDate: '2026-05-31',
    status: 'pago',
    amount: 98400,
    authority: 'AT',
    description: 'Liquidado e confirmado via e-Tributação.',
    daysRemaining: -20
  },
  {
    id: 'obl-inss-mai26',
    title: 'INSS – Folha de Maio/2026',
    category: 'INSS',
    period: 'Maio/2026',
    dueDate: '2026-06-10',
    status: 'pago',
    amount: 44100,
    authority: 'INSS',
    description: 'Guia quitada e comprovativo arquivado.',
    daysRemaining: -10
  }
];

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alt-1',
    title: 'IVA – Junho/2026',
    message: 'Não deixe para a última hora. Evite multas e juros de mora.',
    severity: 'critical',
    category: 'IVA',
    date: '2026-06-27',
    dueDate: '30/06/2026',
    daysRemaining: 3,
    read: false,
    actionUrl: '/calendario',
    actionLabel: 'Ver Detalhes'
  },
  {
    id: 'alt-2',
    title: 'INSS – Junho/2026',
    message: 'A contribuição deve ser paga até o dia 10 do mês seguinte.',
    severity: 'warning',
    category: 'INSS',
    date: '2026-06-25',
    dueDate: '10/07/2026',
    daysRemaining: 8,
    read: false,
    actionUrl: '/simuladores',
    actionLabel: 'Simular INSS'
  },
  {
    id: 'alt-3',
    title: 'TAE Municipal',
    message: 'Obrigação municipal. Consulte o seu município para emissão da guia.',
    severity: 'info',
    category: 'TAE',
    date: '2026-06-20',
    dueDate: '20/07/2026',
    daysRemaining: 20,
    read: false,
    actionUrl: '/calendario',
    actionLabel: 'Consultar Tabela'
  },
  {
    id: 'alt-4',
    title: 'Alvará Comercial',
    message: 'Renove o seu alvará para evitar penalizações e inspeções municipais.',
    severity: 'info',
    category: 'Alvara',
    date: '2026-06-15',
    dueDate: '15/08/2026',
    daysRemaining: 45,
    read: true,
    actionUrl: '/calendario',
    actionLabel: 'Ver Requisitos'
  }
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Alteração ao Regulamento do IVA',
    date: '25/06/2026',
    summary: 'Nova tabela e regras entram em vigor para prestação de serviços transfronteiriços.',
    category: 'IVA',
    readTime: '3 min',
    source: 'Boletim da República',
    badgeType: 'blue',
    content: 'O Ministério da Economia e Finanças publicou a actualização das taxas e mecanismos de retenção para serviços de transmissão digital e consultorias estrangeiras.'
  },
  {
    id: 'news-2',
    title: 'Novo prazo para declaração Modelo 22',
    date: '24/06/2026',
    summary: 'Autoridade Tributária disponibiliza novo prazo até 30 de Junho no portal e-Tributação.',
    category: 'IRPC',
    readTime: '2 min',
    source: 'Autoridade Tributária de Moçambique',
    badgeType: 'green',
    content: 'A AT anunciou que o portal e-Tributação foi optimizado para suportar picos de submissão do Modelo 22 de IRPC sem sobrecarga de servidores.'
  },
  {
    id: 'news-3',
    title: 'Comunicado do INSS',
    date: '22/06/2026',
    summary: 'Ajuste e modernização nos sistemas de declaração de contribuições do SISSMO.',
    category: 'INSS',
    readTime: '4 min',
    source: 'INSS Moçambique',
    badgeType: 'purple',
    content: 'O Instituto Nacional de Segurança Social reforça a obrigatoriedade do carregamento digital das folhas de remunerações até dia 10 de cada mês.'
  },
  {
    id: 'news-4',
    title: 'Benefícios fiscais para PME',
    date: '20/06/2026',
    summary: 'Governo anuncia novas medidas de apoio e redução de taxas aduaneiras e incentivos ao investimento.',
    category: 'PME',
    readTime: '5 min',
    source: 'Governo de Moçambique',
    badgeType: 'amber',
    content: 'Pacote de aceleração económica inclui incentivos tributários para micro, pequenas e médias empresas nos sectores de agricultura, turismo e tecnologia.'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'ABC Comércio, Lda',
    nuit: '400123456',
    plan: 'PME',
    status: 'regular',
    nextObligation: 'IVA – 30/06/2026',
    nextObligationDate: '2026-06-30',
    contactEmail: 'geral@abccomercio.co.mz',
    contactPhone: '+258 84 555 1234',
    activitySector: 'Comércio Geral & Distribuição',
    city: 'Maputo'
  },
  {
    id: 'cli-2',
    name: 'XPTO Serviços, Lda',
    nuit: '500984321',
    plan: 'PME',
    status: 'alerta',
    nextObligation: 'INSS – 10/07/2026',
    nextObligationDate: '2026-07-10',
    contactEmail: 'admin@xpto.co.mz',
    contactPhone: '+258 82 444 9876',
    activitySector: 'Consultoria e TI',
    city: 'Matola'
  },
  {
    id: 'cli-3',
    name: 'Construções Forte, Lda',
    nuit: '600987654',
    plan: 'Contabilidade',
    status: 'regular',
    nextObligation: 'TAE – 20/07/2026',
    nextObligationDate: '2026-07-20',
    contactEmail: 'obras@construcoesforte.co.mz',
    contactPhone: '+258 86 333 4567',
    activitySector: 'Construção Civil & Obras Públicas',
    city: 'Beira'
  },
  {
    id: 'cli-4',
    name: 'Mercado Digital, Lda',
    nuit: '700111222',
    plan: 'PME',
    status: 'regular',
    nextObligation: 'IVA – 30/06/2026',
    nextObligationDate: '2026-06-30',
    contactEmail: 'finance@mercadodigital.co.mz',
    contactPhone: '+258 87 777 8899',
    activitySector: 'E-commerce e Serviços Digitais',
    city: 'Nampula'
  },
  {
    id: 'cli-5',
    name: 'Logística & Navegação Lda',
    nuit: '400555666',
    plan: 'Enterprise',
    status: 'critico',
    nextObligation: 'IVA – 30/06/2026',
    nextObligationDate: '2026-06-30',
    contactEmail: 'portuario@logistica.co.mz',
    contactPhone: '+258 84 999 0011',
    activitySector: 'Transporte e Logística Internacional',
    city: 'Nacala'
  }
];

export const INITIAL_LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'doc-civa',
    title: 'Código do Imposto sobre o Valor Acrescentado (IVA)',
    type: 'lei',
    number: 'Lei n.º 25/2007, alterada pela Lei n.º 1/2018',
    date: '25/01/2007',
    summary: 'Aprova o Código do IVA em Moçambique, definindo as regras de incidência objectiva e subjectiva, taxas (16%), isenções e apuramento.',
    category: 'Fiscal / IVA',
    officialGazette: 'BR I Série – N.º 52',
    articlesCount: 54,
    keyArticles: [
      {
        number: 'Artigo 15',
        title: 'Localização das Operações',
        summary: 'Determina onde o serviço se considera tributado.',
        fullText: 'As prestações de serviços são tributadas em território nacional quando o prestador tenha no mesmo a sede ou estabelecimento estável, ou quando o adquirente for sujeito passivo residente em Moçambique no caso de serviços de consultoria, engenharia, processamento de dados e assistência técnica.'
      },
      {
        number: 'Artigo 17',
        title: 'Regras de Autoliquidação e Serviços Estrangeiros',
        summary: 'Obrigatoriedade de autoliquidação pelo adquirente em território moçambicano.',
        fullText: 'Nas prestações de serviços efectuadas por sujeitos passivos não residentes sem estabelecimento estável, o imposto é devido e deve ser liquidado pelo adquirente residente que seja sujeito passivo de IVA.'
      },
      {
        number: 'Artigo 25',
        title: 'Taxa Normal do IVA',
        summary: 'Fixação da taxa normal em 16%.',
        fullText: 'A taxa geral do Imposto sobre o Valor Acrescentado é fixada em 16% sobre o valor tributável.'
      }
    ]
  },
  {
    id: 'doc-reg-iva',
    title: 'Regulamento do IVA',
    type: 'decreto',
    number: 'Decreto n.º 7/2020',
    date: '15/12/2020',
    summary: 'Regulamenta os procedimentos práticos de apuramento, dedução, facturação electrónica e retenção na fonte do IVA.',
    category: 'Fiscal / IVA',
    officialGazette: 'BR I Série – N.º 220',
    articlesCount: 42
  },
  {
    id: 'doc-cirps',
    title: 'Código do Imposto sobre Rendimentos das Pessoas Singulares (IRPS)',
    type: 'lei',
    number: 'Lei n.º 33/2007, de 31 de Dezembro',
    date: '01/08/2007',
    summary: 'Estabelece a tributação de rendimentos do trabalho dependente (1ª Categoria), empresarial (2ª Categoria) e capitais.',
    category: 'Fiscal / IRPS',
    officialGazette: 'BR I Série – N.º 52',
    articlesCount: 78
  },
  {
    id: 'doc-cirpc',
    title: 'Código do Imposto sobre Rendimentos das Pessoas Colectivas (IRPC)',
    type: 'lei',
    number: 'Lei n.º 34/2014, de 31 de Dezembro',
    date: '31/12/2014',
    summary: 'Disciplina a tributação do lucro de sociedades comerciais, cooperativas e entidades não residentes com retenção definitiva.',
    category: 'Fiscal / IRPC',
    officialGazette: 'BR I Série – N.º 105',
    articlesCount: 96,
    keyArticles: [
      {
        number: 'Artigo 65',
        title: 'Retenção na Fonte a Não Residentes',
        summary: 'Incidência de IRPC sobre pagamentos transfronteiriços.',
        fullText: 'Estão sujeitos a retenção na fonte a título definitivo, à taxa de 20%, os rendimentos obtidos em território nacional por entidades não residentes sem estabelecimento estável.'
      },
      {
        number: 'Artigo 66',
        title: 'Taxas de Retenção Definitiva',
        summary: 'Fixa a taxa de 20% para prestações de serviços internacionais.',
        fullText: 'A taxa de retenção na fonte incidente sobre rendimentos derivados de prestações de serviços realizados por entidades estrangeiras é de 20% calculada sobre o contra-valor com base no factor de incidência.'
      }
    ]
  },
  {
    id: 'doc-lgt',
    title: 'Lei Geral Tributária',
    type: 'lei',
    number: 'Lei n.º 15/2002, de 26 de Junho',
    date: '26/06/2002',
    summary: 'Consagra os princípios fundamentais do sistema tributário moçambicano, garantias dos contribuintes e regime das infracções.',
    category: 'Geral Tributário',
    officialGazette: 'BR I Série – N.º 26',
    articlesCount: 112
  },
  {
    id: 'doc-tae',
    title: 'Regulamento da Taxa de Actividade Económica (TAE)',
    type: 'regulamento',
    number: 'Postura Municipal n.º 12/2018',
    date: '10/03/2018',
    summary: 'Regula o lançamento e cobrança da TAE devida por estabelecimentos comerciais e industriais nos municípios de Moçambique.',
    category: 'Municipal / Autárquico',
    officialGazette: 'Boletim Municipal de Maputo',
    articlesCount: 28
  }
];

export const INITIAL_SIMULATIONS: SimulationRecord[] = [
  {
    id: 'sim-001',
    simulatorId: 'pagamento-nao-residentes',
    simulatorTitle: 'Pagamento ao Exterior',
    date: '2026-07-15',
    clientName: 'Google LLC',
    nuit: '400998822',
    currency: 'USD',
    originalAmount: 10000,
    exchangeRate: 63.75,
    mznAmount: 637500,
    factor: 1.25,
    taxBase: 796875,
    ivaAmount: 127500,
    ivaRate: 16,
    irpcAmount: 159375,
    irpcRate: 20,
    totalTax: 286875,
    description: 'Serviços de infraestrutura cloud e licenças de software corporativo',
    providerCountry: 'Estados Unidos',
    status: 'concluido',
    responsibleName: 'Carlos Apollo',
    createdAt: '2026-07-15T14:30:00Z'
  },
  {
    id: 'sim-002',
    simulatorId: 'iva-operacoes',
    simulatorTitle: 'IVA – Operações',
    date: '2026-07-12',
    clientName: 'ABC Comércio, Lda',
    nuit: '400123456',
    currency: 'MZN',
    originalAmount: 500000,
    exchangeRate: 1,
    mznAmount: 500000,
    factor: 1.0,
    taxBase: 500000,
    ivaAmount: 80000,
    ivaRate: 16,
    irpcAmount: 0,
    irpcRate: 0,
    totalTax: 80000,
    description: 'Apuramento mensal de vendas vs compras dedutíveis',
    providerCountry: 'Moçambique',
    status: 'concluido',
    responsibleName: 'Carlos Apollo',
    createdAt: '2026-07-12T10:15:00Z'
  },
  {
    id: 'sim-003',
    simulatorId: 'irps-retencoes',
    simulatorTitle: 'IRPS – Retenções',
    date: '2026-07-10',
    clientName: 'XYZ, Lda',
    nuit: '500123999',
    currency: 'MZN',
    originalAmount: 250000,
    exchangeRate: 1,
    mznAmount: 250000,
    factor: 1.0,
    taxBase: 250000,
    ivaAmount: 0,
    ivaRate: 0,
    irpcAmount: 37500,
    irpcRate: 15,
    totalTax: 37500,
    description: 'Retenção na fonte sobre prestação de serviços de auditoria',
    providerCountry: 'Moçambique',
    status: 'concluido',
    responsibleName: 'Carlos Apollo',
    createdAt: '2026-07-10T09:00:00Z'
  },
  {
    id: 'sim-004',
    simulatorId: 'salario-liquido',
    simulatorTitle: 'Salário Líquido & RH',
    date: '2026-07-08',
    clientName: 'Empresa Exemplo',
    nuit: '400667788',
    currency: 'MZN',
    originalAmount: 158750,
    exchangeRate: 1,
    mznAmount: 158750,
    factor: 1.0,
    taxBase: 158750,
    ivaAmount: 0,
    ivaRate: 0,
    irpcAmount: 0,
    irpcRate: 0,
    totalTax: 31250,
    description: 'Folha de salários para quadros seniores e directores',
    providerCountry: 'Moçambique',
    status: 'concluido',
    responsibleName: 'Carlos Apollo',
    createdAt: '2026-07-08T16:45:00Z'
  },
  {
    id: 'sim-005',
    simulatorId: 'inss-contribuicoes',
    simulatorTitle: 'INSS – Contribuições',
    date: '2026-07-05',
    clientName: 'Empresa Teste',
    nuit: '400223344',
    currency: 'MZN',
    originalAmount: 646142,
    exchangeRate: 1,
    mznAmount: 646142,
    factor: 1.0,
    taxBase: 646142,
    ivaAmount: 0,
    ivaRate: 0,
    irpcAmount: 0,
    irpcRate: 0,
    totalTax: 45230,
    description: 'Cálculo de contribuição de segurança social para 24 trabalhadores',
    providerCountry: 'Moçambique',
    status: 'concluido',
    responsibleName: 'Carlos Apollo',
    createdAt: '2026-07-05T11:20:00Z'
  }
];
