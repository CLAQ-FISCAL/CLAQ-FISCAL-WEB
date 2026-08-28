import { NewsItem } from '../types';

export const OFFICIAL_GAZETTE_FEED: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Alteração ao Regulamento do IVA – Operações Transfronteiriças',
    date: '2026-06-25',
    category: 'IVA',
    summary: 'A Autoridade Tributária clarifica a aplicação do fator 1,25 (gross-up) em contratos líquidos de impostos celebrados com entidades não residentes.',
    readTime: '3 min',
    source: 'Boletim da República I Série',
    badgeType: 'blue'
  },
  {
    id: 'news-2',
    title: 'Novo Prazo para Entrega da Declaração Anual Modelo 22 (IRPC)',
    date: '2026-06-24',
    category: 'IRPC',
    summary: 'Prorrogação de prazos para submissão digital da demonstração de resultados fiscais no portal e-Tributação para contribuintes de média e grande dimensão.',
    readTime: '4 min',
    source: 'Autoridade Tributária de Moçambique',
    badgeType: 'green'
  },
  {
    id: 'news-3',
    title: 'Comunicado do INSS sobre Folhas de Salários Digitais (SISSMO)',
    date: '2026-06-22',
    category: 'INSS',
    summary: 'Aviso sobre a obrigatoriedade do carregamento das folhas de remuneração até ao dia 10 de cada mês através da plataforma SISSMO.',
    readTime: '2 min',
    source: 'Instituto Nacional de Segurança Social',
    badgeType: 'purple'
  },
  {
    id: 'news-4',
    title: 'Postura Municipal sobre Licenciamento Simplificado em Maputo',
    date: '2026-06-20',
    category: 'Municipal',
    summary: 'Conselho Municipal de Maputo aprova novos incentivos e redução de taxas de renovação do Alvará Comercial para Micro e Pequenas Empresas.',
    readTime: '5 min',
    source: 'Conselho Municipal de Maputo',
    badgeType: 'amber'
  }
];
