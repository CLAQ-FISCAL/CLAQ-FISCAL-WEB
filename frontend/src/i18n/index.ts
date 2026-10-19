import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptCommon from './locales/pt/common.json';
import ptHeader from './locales/pt/header.json';
import ptSidebar from './locales/pt/sidebar.json';
import ptLayout from './locales/pt/layout.json';
import ptLogin from './locales/pt/login.json';
import ptOnboarding from './locales/pt/onboarding.json';
import ptState from './locales/pt/state.json';
import ptDashboard from './locales/pt/dashboard.json';
import ptCalendar from './locales/pt/calendar.json';
import ptAlerts from './locales/pt/alerts.json';
import ptReports from './locales/pt/reports.json';
import ptBiblioteca from './locales/pt/biblioteca.json';
import ptClientes from './locales/pt/clientes.json';
import ptConfig from './locales/pt/config.json';
import ptNewsletter from './locales/pt/newsletter.json';
import ptSupport from './locales/pt/support.json';
import ptSimuladores from './locales/pt/simuladores.json';
import ptWhatsapp from './locales/pt/whatsapp.json';
import ptAi from './locales/pt/ai.json';
import ptCheckout from './locales/pt/checkout.json';
import ptPdf from './locales/pt/pdf.json';
import ptData from './locales/pt/data.json';
import ptUploads from './locales/pt/uploads.json';
import enCommon from './locales/en/common.json';
import enHeader from './locales/en/header.json';
import enSidebar from './locales/en/sidebar.json';
import enLayout from './locales/en/layout.json';
import enLogin from './locales/en/login.json';
import enOnboarding from './locales/en/onboarding.json';
import enState from './locales/en/state.json';
import enDashboard from './locales/en/dashboard.json';
import enCalendar from './locales/en/calendar.json';
import enAlerts from './locales/en/alerts.json';
import enReports from './locales/en/reports.json';
import enBiblioteca from './locales/en/biblioteca.json';
import enClientes from './locales/en/clientes.json';
import enConfig from './locales/en/config.json';
import enNewsletter from './locales/en/newsletter.json';
import enSupport from './locales/en/support.json';
import enSimuladores from './locales/en/simuladores.json';
import enWhatsapp from './locales/en/whatsapp.json';
import enAi from './locales/en/ai.json';
import enCheckout from './locales/en/checkout.json';
import enPdf from './locales/en/pdf.json';
import enData from './locales/en/data.json';
import enUploads from './locales/en/uploads.json';

export type AppLanguage = 'pt' | 'en';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['pt', 'en'];

export const isSupportedLanguage = (lng?: string | null): lng is AppLanguage =>
  lng === 'pt' || lng === 'en';

const stored =
  typeof window !== 'undefined' ? localStorage.getItem('claq_language') : null;

export const resources = {
  pt: {
    common: ptCommon,
    header: ptHeader,
    sidebar: ptSidebar,
    layout: ptLayout,
    login: ptLogin,
    onboarding: ptOnboarding,
    state: ptState,
    dashboard: ptDashboard,
    calendar: ptCalendar,
    alerts: ptAlerts,
    reports: ptReports,
    biblioteca: ptBiblioteca,
    clientes: ptClientes,
    config: ptConfig,
    newsletter: ptNewsletter,
    support: ptSupport,
    simuladores: ptSimuladores,
    whatsapp: ptWhatsapp,
    ai: ptAi,
    checkout: ptCheckout,
    pdf: ptPdf,
    data: ptData,
    uploads: ptUploads
  },
  en: {
    common: enCommon,
    header: enHeader,
    sidebar: enSidebar,
    layout: enLayout,
    login: enLogin,
    onboarding: enOnboarding,
    state: enState,
    dashboard: enDashboard,
    calendar: enCalendar,
    alerts: enAlerts,
    reports: enReports,
    biblioteca: enBiblioteca,
    clientes: enClientes,
    config: enConfig,
    newsletter: enNewsletter,
    support: enSupport,
    simuladores: enSimuladores,
    whatsapp: enWhatsapp,
    ai: enAi,
    checkout: enCheckout,
    pdf: enPdf,
    data: enData,
    uploads: enUploads
  }
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: isSupportedLanguage(stored) ? stored : 'pt',
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
  returnNull: false
});

export default i18n;