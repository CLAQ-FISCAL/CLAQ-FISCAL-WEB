import { NewsItem } from '../types';
import type { TFunction } from 'i18next';

export const OFFICIAL_GAZETTE_FEED = (t: TFunction): NewsItem[] => [
  {
    id: 'news-1',
    title: t('data:gazette1Title'),
    date: '2026-06-25',
    category: t('data:gazette1Category'),
    summary: t('data:gazette1Summary'),
    readTime: t('data:gazette1ReadTime'),
    source: t('data:gazette1Source'),
    badgeType: 'blue'
  },
  {
    id: 'news-2',
    title: t('data:gazette2Title'),
    date: '2026-06-24',
    category: t('data:gazette2Category'),
    summary: t('data:gazette2Summary'),
    readTime: t('data:gazette2ReadTime'),
    source: t('data:gazette2Source'),
    badgeType: 'green'
  },
  {
    id: 'news-3',
    title: t('data:gazette3Title'),
    date: '2026-06-22',
    category: t('data:gazette3Category'),
    summary: t('data:gazette3Summary'),
    readTime: t('data:gazette3ReadTime'),
    source: t('data:gazette3Source'),
    badgeType: 'purple'
  },
  {
    id: 'news-4',
    title: t('data:gazette4Title'),
    date: '2026-06-20',
    category: t('data:gazette4Category'),
    summary: t('data:gazette4Summary'),
    readTime: t('data:gazette4ReadTime'),
    source: t('data:gazette4Source'),
    badgeType: 'amber'
  }
];