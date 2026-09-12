import type { TFunction } from 'i18next';
import {
  DollarSign,
  Percent,
  Users,
  TrendingUp,
  Briefcase,
  Info,
  FileText,
  Calculator,
  Clock,
  Calendar,
} from 'lucide-react';

export interface SimulatorCard {
  id: string;
  slug: string;
  category: 'Fiscal' | 'Laboral (RH)';
  title: string;
  desc: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
}

export const simulatorCatalog = (t: TFunction): SimulatorCard[] => [
  {
    id: 'non-resident',
    slug: 'pagamento-nao-residentes',
    category: 'Fiscal',
    title: t('simuladores:simNonResidentTitle'),
    desc: t('simuladores:simNonResidentDesc'),
    icon: DollarSign,
    color: '#2563EB',
    bg: 'var(--blue-50)',
  },
  {
    id: 'iva-ops',
    slug: 'iva-operacoes',
    category: 'Fiscal',
    title: t('simuladores:simIvaOpsTitle'),
    desc: t('simuladores:simIvaOpsDesc'),
    icon: Percent,
    color: '#D97706',
    bg: 'var(--gold-50)',
  },
  {
    id: 'irps-ret',
    slug: 'irps-retencoes',
    category: 'Fiscal',
    title: t('simuladores:simIrpsTitle'),
    desc: t('simuladores:simIrpsDesc'),
    icon: Users,
    color: '#059669',
    bg: 'var(--emerald-50)',
  },
  {
    id: 'irpc-est',
    slug: 'irpc-estimativa',
    category: 'Fiscal',
    title: t('simuladores:simIrpcTitle'),
    desc: t('simuladores:simIrpcDesc'),
    icon: TrendingUp,
    color: '#7C3AED',
    bg: '#FAF5FF',
  },
  {
    id: 'inss-cont',
    slug: 'inss-contribuicoes',
    category: 'Fiscal',
    title: t('simuladores:simInssTitle'),
    desc: t('simuladores:simInssDesc'),
    icon: Briefcase,
    color: '#0284C7',
    bg: '#F0F9FF',
  },
  {
    id: 'fines',
    slug: 'juros-multas',
    category: 'Fiscal',
    title: t('simuladores:simFinesTitle'),
    desc: t('simuladores:simFinesDesc'),
    icon: Info,
    color: '#DC2626',
    bg: 'var(--red-50)',
  },
  {
    id: 'stamp-tax',
    slug: 'imposto-selo',
    category: 'Fiscal',
    title: t('simuladores:simStampTaxTitle'),
    desc: t('simuladores:simStampTaxDesc'),
    icon: FileText,
    color: '#475569',
    bg: 'var(--slate-100)',
  },
  {
    id: 'salario',
    slug: 'salario-liquido',
    category: 'Laboral (RH)',
    title: t('simuladores:simSalaryTitle'),
    desc: t('simuladores:simSalaryDesc'),
    icon: Calculator,
    color: '#2563EB',
    bg: 'var(--blue-50)',
  },
  {
    id: 'extra-hours',
    slug: 'horas-extras',
    category: 'Laboral (RH)',
    title: t('simuladores:simExtraHoursTitle'),
    desc: t('simuladores:simExtraHoursDesc'),
    icon: Clock,
    color: '#D97706',
    bg: 'var(--gold-50)',
  },
  {
    id: 'vacations',
    slug: 'ferias',
    category: 'Laboral (RH)',
    title: t('simuladores:simVacationsTitle'),
    desc: t('simuladores:simVacationsDesc'),
    icon: Calendar,
    color: '#059669',
    bg: 'var(--emerald-50)',
  },
  {
    id: 'indemnity',
    slug: 'indemnizacao',
    category: 'Laboral (RH)',
    title: t('simuladores:simIndemnityTitle'),
    desc: t('simuladores:simIndemnityDesc'),
    icon: Briefcase,
    color: '#EA580C',
    bg: '#FFF7ED',
  },
];

export function getSimulatorBySlug(
  slug: string,
  t: TFunction
): SimulatorCard | undefined {
  return simulatorCatalog(t).find((s) => s.slug === slug);
}