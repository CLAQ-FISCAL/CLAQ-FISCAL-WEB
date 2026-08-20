export type ObligationStatus = 'pago' | 'pendente' | 'a_vencer' | 'vencido' | 'a_renovar';
export type ObligationCategory = 'IVA' | 'INSS' | 'IRPS' | 'IRPC' | 'TAE' | 'Alvara' | 'IS' | 'Outros';
export type TaxAuthority = 'AT' | 'INSS' | 'Municipio' | 'BAU' | 'Geral';

export interface FiscalObligation {
  id: string;
  title: string;
  category: ObligationCategory;
  period: string;
  dueDate: string; // YYYY-MM-DD
  status: ObligationStatus;
  amount?: number;
  authority: TaxAuthority;
  description: string;
  penaltyRisk?: string;
  daysRemaining?: number;
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: ObligationCategory;
  date: string;
  dueDate: string;
  daysRemaining: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface SimulationRecord {
  id: string;
  simulatorId: string;
  simulatorTitle: string;
  date: string; // YYYY-MM-DD
  clientName: string;
  nuit?: string;
  currency: string;
  originalAmount: number;
  exchangeRate: number;
  mznAmount: number;
  factor: number;
  taxBase: number;
  ivaAmount: number;
  ivaRate: number;
  irpcAmount: number;
  irpcRate: number;
  totalTax: number;
  description?: string;
  providerCountry?: string;
  status: 'concluido' | 'rascunho' | 'revisado';
  responsibleName: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  nuit: string;
  plan: 'PME' | 'Contabilidade' | 'Enterprise' | 'Básico';
  status: 'regular' | 'alerta' | 'critico';
  nextObligation: string;
  nextObligationDate: string;
  contactEmail: string;
  contactPhone: string;
  activitySector: string;
  city: string;
}

export type LegalDocType = 'lei' | 'decreto' | 'regulamento' | 'diploma' | 'outro';

export interface LegalDocArticle {
  number: string;
  title: string;
  summary: string;
  fullText: string;
}

export interface LegalDoc {
  id: string;
  title: string;
  type: LegalDocType;
  number: string;
  date: string;
  summary: string;
  category: string;
  officialGazette?: string;
  articlesCount?: number;
  fullText?: string;
  keyArticles?: LegalDocArticle[];
  pdfUrl?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  readTime: string;
  source: string;
  badgeType: 'blue' | 'green' | 'purple' | 'amber';
  content?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
  companyName: string;
  companyNuit: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  plan: 'PME' | 'Contabilidade' | 'Enterprise';
  planStatus: 'active' | 'trial' | 'expired';
  renewalDate: string;
}

export interface NotificationSettings {
  email: boolean;
  whatsapp: boolean;
  inApp: boolean;
  sms: boolean;
}

export interface AlertTimingSettings {
  d7: boolean;
  d3: boolean;
  d1: boolean;
  d0: boolean;
}

export interface SystemSettings {
  notifications: NotificationSettings;
  alertTiming: AlertTimingSettings;
  whatsappNumber: string;
  isWhatsAppConnected: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'pt-PT';
}
