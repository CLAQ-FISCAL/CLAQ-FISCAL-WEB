import { LegalDoc } from '../types';

export const STATUTORY_LEGISLATION: LegalDoc[] = [
  {
    id: 'doc-civa',
    title: 'Código do Imposto sobre o Valor Acrescentado (CIVA)',
    type: 'lei',
    number: 'Lei n.º 32/2007 alterada pela Lei n.º 1/2018',
    date: '2018-01-12',
    category: 'IVA',
    summary: 'Aprova o Código do IVA. Incidência objectiva e subjectiva, taxas (16%), isenções, operações transfronteiriças e regras de apuramento.',
    articlesCount: 78,
    fullText: 'Código do IVA anotado e comentado para Moçambique.'
  },
  {
    id: 'doc-reg-iva',
    title: 'Regulamento do Imposto sobre o Valor Acrescentado',
    type: 'decreto',
    number: 'Decreto n.º 7/2020',
    date: '2020-03-10',
    category: 'IVA',
    summary: 'Regulamenta as disposições do CIVA, incluindo prazos de submissão do Modelo A, faturas eletrónicas e regras de retenção na fonte.',
    articlesCount: 45,
    fullText: 'Regulamento do IVA aprovado pelo Conselho de Ministros.'
  },
  {
    id: 'doc-cirps',
    title: 'Código do Imposto sobre o Rendimento das Pessoas Singulares (CIRPS)',
    type: 'lei',
    number: 'Lei n.º 33/2007 alterada',
    date: '2007-12-31',
    category: 'IRPS',
    summary: 'Tributação de rendimentos de trabalho dependente (1ª Categoria), trabalho independente (2ª Categoria) e capitais. Tabela de retenção na fonte.',
    articlesCount: 92,
    fullText: 'Código do IRPS e tabelas de retenção na fonte.'
  },
  {
    id: 'doc-cirpc',
    title: 'Código do Imposto sobre o Rendimento das Pessoas Colectivas (CIRPC)',
    type: 'lei',
    number: 'Lei n.º 34/2014',
    date: '2014-12-31',
    category: 'IRPC',
    summary: 'Incidência de IRPC (32%), pagamentos por conta, modelo 22 e retenções na fonte a não residentes (20%) e prestadores locais.',
    articlesCount: 110,
    fullText: 'Código do IRPC para pessoas colectivas em Moçambique.'
  },
  {
    id: 'doc-lgt',
    title: 'Lei Geral Tributária (LGT)',
    type: 'lei',
    number: 'Lei n.º 15/2002',
    date: '2002-06-26',
    category: 'Geral',
    summary: 'Princípios gerais do direito tributário moçambicano, direitos e deveres dos contribuintes, regime de juros de mora e multas por atraso (Artigo 101).',
    articlesCount: 145,
    fullText: 'Lei Geral Tributária da República de Moçambique.'
  },
  {
    id: 'doc-tae',
    title: 'Postura Sobre a Taxa de Atividade Económica (TAE)',
    type: 'outro',
    number: 'Postura Municipal n.º 12/2018',
    date: '2018-05-15',
    category: 'Municipal',
    summary: 'Regulamento das taxas de funcionamento comercial, industrial e prestação de serviços no Conselho Municipal de Maputo e Matola.',
    articlesCount: 32,
    fullText: 'Postura sobre a TAE do Conselho Municipal.'
  }
];
