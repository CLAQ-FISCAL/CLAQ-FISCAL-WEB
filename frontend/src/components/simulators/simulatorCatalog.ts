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

export const simulatorCatalog: SimulatorCard[] = [
  {
    id: 'non-resident',
    slug: 'pagamento-nao-residentes',
    category: 'Fiscal',
    title: 'Pagamento de Serviços a Não Residentes',
    desc: 'Calcule IVA e IRPC sobre pagamentos ao exterior.',
    icon: DollarSign,
    color: '#2563EB',
    bg: 'var(--blue-50)',
  },
  {
    id: 'iva-ops',
    slug: 'iva-operacoes',
    category: 'Fiscal',
    title: 'IVA – Operações',
    desc: 'Calcule o IVA a pagar ou recuperar nas operações.',
    icon: Percent,
    color: '#D97706',
    bg: 'var(--gold-50)',
  },
  {
    id: 'irps-ret',
    slug: 'irps-retencoes',
    category: 'Fiscal',
    title: 'IRPS – Retenções',
    desc: 'Calcule o imposto sobre rendimentos de trabalho.',
    icon: Users,
    color: '#059669',
    bg: 'var(--emerald-50)',
  },
  {
    id: 'irpc-est',
    slug: 'irpc-estimativa',
    category: 'Fiscal',
    title: 'IRPC – Estimativa',
    desc: 'Calcule o IRPC estimado da sua empresa.',
    icon: TrendingUp,
    color: '#7C3AED',
    bg: '#FAF5FF',
  },
  {
    id: 'inss-cont',
    slug: 'inss-contribuicoes',
    category: 'Fiscal',
    title: 'INSS – Contribuições',
    desc: 'Calcule as contribuições ao INSS trabalhador e patronal.',
    icon: Briefcase,
    color: '#0284C7',
    bg: '#F0F9FF',
  },
  {
    id: 'fines',
    slug: 'juros-multas',
    category: 'Fiscal',
    title: 'Juros e Multas',
    desc: 'Calcule juros e multas por incumprimento fiscal.',
    icon: Info,
    color: '#DC2626',
    bg: 'var(--red-50)',
  },
  {
    id: 'stamp-tax',
    slug: 'imposto-selo',
    category: 'Fiscal',
    title: 'Imposto de Selo',
    desc: 'Calcule o imposto de selo aplicável a contratos e recibos.',
    icon: FileText,
    color: '#475569',
    bg: 'var(--slate-100)',
  },
  {
    id: 'salario',
    slug: 'salario-liquido',
    category: 'Laboral (RH)',
    title: 'Salário Líquido',
    desc: 'Calcule o salário líquido do colaborador após descontos legais.',
    icon: Calculator,
    color: '#2563EB',
    bg: 'var(--blue-50)',
  },
  {
    id: 'extra-hours',
    slug: 'horas-extras',
    category: 'Laboral (RH)',
    title: 'Horas Extras',
    desc: 'Calcule o valor das horas extras a pagar.',
    icon: Clock,
    color: '#D97706',
    bg: 'var(--gold-50)',
  },
  {
    id: 'vacations',
    slug: 'ferias',
    category: 'Laboral (RH)',
    title: 'Férias',
    desc: 'Calcule dias e valores de férias dos trabalhadores.',
    icon: Calendar,
    color: '#059669',
    bg: 'var(--emerald-50)',
  },
  {
    id: 'indemnity',
    slug: 'indemnizacao',
    category: 'Laboral (RH)',
    title: 'Indemnização',
    desc: 'Calcule a indemnização por cessação de contrato.',
    icon: Briefcase,
    color: '#EA580C',
    bg: '#FFF7ED',
  },
];

export function getSimulatorBySlug(
  slug: string
): SimulatorCard | undefined {
  return simulatorCatalog.find((s) => s.slug === slug);
}
