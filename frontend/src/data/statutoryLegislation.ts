import { LegalDoc } from '../types';
import type { TFunction } from 'i18next';

export const STATUTORY_LEGISLATION = (t: TFunction): LegalDoc[] => [
  {
    id: 'doc-civa',
    title: t('data:legal1Title'),
    type: 'lei',
    number: t('data:legal1Number'),
    date: '2018-01-12',
    category: t('data:legal1Category'),
    summary: t('data:legal1Summary'),
    articlesCount: 78,
    fullText: t('data:legal1FullText')
  },
  {
    id: 'doc-reg-iva',
    title: t('data:legal2Title'),
    type: 'decreto',
    number: t('data:legal2Number'),
    date: '2020-03-10',
    category: t('data:legal2Category'),
    summary: t('data:legal2Summary'),
    articlesCount: 45,
    fullText: t('data:legal2FullText')
  },
  {
    id: 'doc-cirps',
    title: t('data:legal3Title'),
    type: 'lei',
    number: t('data:legal3Number'),
    date: '2007-12-31',
    category: t('data:legal3Category'),
    summary: t('data:legal3Summary'),
    articlesCount: 92,
    fullText: t('data:legal3FullText')
  },
  {
    id: 'doc-cirpc',
    title: t('data:legal4Title'),
    type: 'lei',
    number: t('data:legal4Number'),
    date: '2014-12-31',
    category: t('data:legal4Category'),
    summary: t('data:legal4Summary'),
    articlesCount: 110,
    fullText: t('data:legal4FullText')
  },
  {
    id: 'doc-lgt',
    title: t('data:legal5Title'),
    type: 'lei',
    number: t('data:legal5Number'),
    date: '2002-06-26',
    category: t('data:legal5Category'),
    summary: t('data:legal5Summary'),
    articlesCount: 145,
    fullText: t('data:legal5FullText')
  },
  {
    id: 'doc-tae',
    title: t('data:legal6Title'),
    type: 'outro',
    number: t('data:legal6Number'),
    date: '2018-05-15',
    category: t('data:legal6Category'),
    summary: t('data:legal6Summary'),
    articlesCount: 32,
    fullText: t('data:legal6FullText')
  }
];
