import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  FiscalObligation,
  AlertItem,
  Client,
  SimulationRecord,
  SystemSettings
} from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { NonResidentServiceResult } from '../data/taxEngine';
import { CalendarEngine } from '../utils/calendarEngine';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppStateContextType {
  // User & Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => boolean;
  registerUser: (userData: Partial<UserProfile>) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;

  // Obligations (User-generated)
  obligations: FiscalObligation[];
  markObligationPaid: (id: string) => void;
  addObligation: (obl: Omit<FiscalObligation, 'id'>) => void;
  deleteObligation: (id: string) => void;
  loadStandardMozambiqueTemplate: () => void;
  clearAllUserData: () => void;

  // Dynamic Alerts (Derived from user obligations & real dates)
  alerts: AlertItem[];
  unreadAlertsCount: number;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  dispatchTestAlert: (channel: 'whatsapp' | 'email' | 'sms' | 'system') => void;

  // Simulations (User-generated)
  simulations: SimulationRecord[];
  saveSimulation: (sim: Omit<SimulationRecord, 'id' | 'createdAt'>) => SimulationRecord;
  deleteSimulation: (id: string) => void;
  activeSimulationResult: NonResidentServiceResult | null;
  setActiveSimulationResult: (res: NonResidentServiceResult | null) => void;
  activeSimulationInput: any;
  setActiveSimulationInput: (input: any) => void;

  // Clients (User-generated)
  clients: Client[];
  activeClient: Client | null;
  setActiveClient: (client: Client | null) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  deleteClient: (id: string) => void;

  // Settings
  settings: SystemSettings;
  updateSettings: (data: Partial<SystemSettings>) => void;
  toggleNotificationChannel: (channel: keyof SystemSettings['notifications']) => void;
  toggleAlertTiming: (timing: keyof SystemSettings['alertTiming']) => void;
  connectWhatsApp: (phone: string) => void;

  // Modals and Drawers
  isWhatsAppModalOpen: boolean;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;
  aiAssistantPrompt: string;
  openAIAssistantWithPrompt: (prompt: string) => void;
  isPDFModalOpen: boolean;
  setIsPDFModalOpen: (open: boolean) => void;
  pdfSimulationData: SimulationRecord | null;
  openPDFPreview: (sim: SimulationRecord) => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Global Simulator View
  simulatorStep: number;
  setSimulatorStep: (step: number) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User state from localStorage (or null for new visitors)
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('claq_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default logged in operator for seamless experience, editable anytime
    return {
      id: 'usr_empresa_001',
      name: 'Carlos Apollo',
      email: 'carlos.apollo@claq.co.mz',
      phone: '+258 84 123 4567',
      role: 'Contabilista / Administrador',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      companyName: 'Minha Empresa, Lda',
      companyNuit: '400889900',
      companyAddress: 'Av. 24 de Julho, Edifício Platinum, 5º Andar',
      companyCity: 'Maputo',
      companyProvince: 'Maputo Cidade',
      plan: 'PME',
      planStatus: 'active',
      renewalDate: '15/12/2026'
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('claq_is_auth') !== 'false';
  });

  // 2. User-generated Obligations
  const [obligations, setObligations] = useState<FiscalObligation[]>(() => {
    const saved = localStorage.getItem('claq_obligations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Generate initial dynamic schedule for the REAL current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentMonthLabel = CalendarEngine.getMonthNamePt(month, year);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    const monthStr = String(month + 1).padStart(2, '0');

    return [
      {
        id: `obl-iva-${year}-${monthStr}`,
        title: 'IVA – Declaração Periódica e Pagamento',
        category: 'IVA',
        period: currentMonthLabel,
        dueDate: `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`,
        status: 'a_vencer',
        amount: 127500,
        authority: 'AT',
        description: 'Declaração periódica do Modelo A e guia de pagamento do IVA relativo às operações do mês.',
        penaltyRisk: 'Multa de 25% a 100% mais juros de mora legais (Art. 101 LGT).',
        daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`)
      },
      {
        id: `obl-inss-${year}-${monthStr}`,
        title: 'INSS – Contribuição Mensal Obrigatória',
        category: 'INSS',
        period: currentMonthLabel,
        dueDate: `${year}-${monthStr}-10`,
        status: 'a_vencer',
        amount: 45230,
        authority: 'INSS',
        description: 'Folha de salários e pagamento de 3% trabalhador + 4% patronal.',
        penaltyRisk: 'Juros de mora mensais e certidão de quitação bloqueada.',
        daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-10`)
      }
    ];
  });

  // 3. User-generated Clients
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('claq_clients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'cli-1',
        name: 'ABC Comércio, Lda',
        nuit: '400123456',
        plan: 'PME',
        status: 'regular',
        nextObligation: 'IVA',
        contactEmail: 'geral@abccomercio.co.mz',
        contactPhone: '+258 84 555 1234',
        activitySector: 'Comércio Geral & Distribuição',
        city: 'Maputo'
      }
    ];
  });

  const [activeClient, setActiveClient] = useState<Client | null>(null);

  // 4. User-generated Simulations
  const [simulations, setSimulations] = useState<SimulationRecord[]>(() => {
    const saved = localStorage.getItem('claq_simulations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeSimulationResult, setActiveSimulationResult] = useState<NonResidentServiceResult | null>(null);
  const [activeSimulationInput, setActiveSimulationInput] = useState<any>(null);

  // 5. Dynamic Alerts (Derived on-the-fly from active obligations)
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('claq_read_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Recalculate dynamic alerts whenever obligations change
  useEffect(() => {
    const generatedAlerts: AlertItem[] = [];

    obligations.forEach(obl => {
      if (obl.status === 'pago') return;

      const days = CalendarEngine.getDaysRemaining(obl.dueDate);
      const isOverdue = days < 0;
      const isUrgent = days <= 3 && days >= 0;
      const isWarning = days > 3 && days <= 7;

      if (isOverdue || isUrgent || isWarning || obl.status === 'a_vencer') {
        const severity = isOverdue ? 'critical' : isUrgent ? 'critical' : isWarning ? 'warning' : 'info';
        const daysText = isOverdue ? `Venceu há ${Math.abs(days)} dias` : days === 0 ? 'Vence hoje!' : `Vence em ${days} dias (${obl.dueDate})`;

        generatedAlerts.push({
          id: `alt-${obl.id}`,
          title: `${obl.category} – ${obl.period}`,
          message: `${obl.title}. ${daysText}. Evite multas e juros fiscais.`,
          severity,
          category: obl.category,
          dueDate: obl.dueDate,
          date: obl.dueDate,
          daysRemaining: days,
          read: readAlertIds.includes(`alt-${obl.id}`)
        });
      }
    });

    setAlerts(generatedAlerts);
  }, [obligations, readAlertIds]);

  // 6. Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('claq_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // 7. Modals & Notifications
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfSimulationData, setPdfSimulationData] = useState<SimulationRecord | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [simulatorStep, setSimulatorStep] = useState(1);

  // Sync to localStorage
  useEffect(() => {
    if (user) localStorage.setItem('claq_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('claq_obligations', JSON.stringify(obligations));
  }, [obligations]);

  useEffect(() => {
    localStorage.setItem('claq_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('claq_simulations', JSON.stringify(simulations));
  }, [simulations]);

  useEffect(() => {
    localStorage.setItem('claq_read_alerts', JSON.stringify(readAlertIds));
  }, [readAlertIds]);

  useEffect(() => {
    localStorage.setItem('claq_settings', JSON.stringify(settings));
  }, [settings]);

  // Toast Helpers
  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Handlers
  const login = (email: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('claq_is_auth', 'true');
    addToast('success', 'Sessão Iniciada', `Bem-vindo de volta, ${user?.name || email}!`);
    return true;
  };

  const registerUser = (userData: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: userData.name || 'Novo Utilizador',
      email: userData.email || 'utilizador@empresa.co.mz',
      phone: userData.phone || '+258 84 000 0000',
      role: userData.role || 'Administrador',
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      companyName: userData.companyName || 'Minha Empresa, Lda',
      companyNuit: userData.companyNuit || '400000000',
      companyAddress: userData.companyAddress || 'Av. Principal, Maputo',
      companyCity: userData.companyCity || 'Maputo',
      companyProvince: userData.companyProvince || 'Maputo Cidade',
      plan: 'PME',
      planStatus: 'active',
      renewalDate: '31/12/2026'
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('claq_is_auth', 'true');
    addToast('success', 'Conta Criada com Sucesso!', 'Bem-vindo ao CLAQ Fiscal Alert.');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('claq_is_auth', 'false');
    addToast('info', 'Sessão Encerrada', 'Até breve!');
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...data });
      addToast('success', 'Perfil Actualizado', 'Os dados da empresa foram gravados com sucesso.');
    }
  };

  // Obligation Handlers
  const markObligationPaid = (id: string) => {
    setObligations(prev =>
      prev.map(obl => (obl.id === id ? { ...obl, status: 'pago' as const } : obl))
    );
    addToast('success', 'Obrigação Liquidada!', 'O estado foi alterado para Pago e o índice de conformidade subiu.');
  };

  const addObligation = (obl: Omit<FiscalObligation, 'id'>) => {
    const newId = `obl-${Date.now()}`;
    const daysRemaining = CalendarEngine.getDaysRemaining(obl.dueDate);
    const newObl: FiscalObligation = {
      ...obl,
      id: newId,
      daysRemaining
    };
    setObligations(prev => [newObl, ...prev]);
    addToast('success', 'Obrigação Registada!', `"${obl.title}" foi adicionada ao seu calendário fiscal.`);
  };

  const deleteObligation = (id: string) => {
    setObligations(prev => prev.filter(o => o.id !== id));
    addToast('info', 'Obrigação Removida', 'O registo foi eliminado do calendário.');
  };

  const loadStandardMozambiqueTemplate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentMonthLabel = CalendarEngine.getMonthNamePt(month, year);
    const monthStr = String(month + 1).padStart(2, '0');
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    const template: FiscalObligation[] = [
      {
        id: `obl-iva-${Date.now()}-1`,
        title: 'IVA – Declaração Periódica Modelo A',
        category: 'IVA',
        period: currentMonthLabel,
        dueDate: `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`,
        status: 'a_vencer',
        amount: 127500,
        authority: 'AT',
        description: 'Declaração e pagamento do IVA relativo às operações correntes.',
        penaltyRisk: 'Multa de 25% a 100% (Artigo 101 da Lei Geral Tributária).',
        daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`)
      },
      {
        id: `obl-inss-${Date.now()}-2`,
        title: 'INSS – Folha de Remunerações',
        category: 'INSS',
        period: currentMonthLabel,
        dueDate: `${year}-${monthStr}-10`,
        status: 'a_vencer',
        amount: 45230,
        authority: 'INSS',
        description: 'Entrega da folha salarial e pagamento da taxa de 7% (3% trabalhador + 4% patronal).',
        penaltyRisk: 'Bloqueio de certidão de quitação e multas mensais.',
        daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-10`)
      },
      {
        id: `obl-tae-${Date.now()}-3`,
        title: 'TAE – Taxa de Atividade Económica',
        category: 'TAE',
        period: `${year}`,
        dueDate: `${year}-${monthStr}-20`,
        status: 'pendente',
        amount: 12000,
        authority: 'Municipio',
        description: 'Obrigação do Conselho Municipal para renovação do exercício económico.',
        penaltyRisk: 'Agravamento municipal de 50%.',
        daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-20`)
      }
    ];

    setObligations(template);
    addToast('success', 'Modelo Padrão Carregado!', 'Obrigações fiscais de Moçambique sincronizadas com o mês actual.');
  };

  const clearAllUserData = () => {
    setObligations([]);
    setClients([]);
    setSimulations([]);
    setReadAlertIds([]);
    addToast('info', 'Dados Limpos', 'Pode agora introduzir os seus dados reais a partir do zero.');
  };

  // Alert Handlers
  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  const markAlertAsRead = (id: string) => {
    setReadAlertIds(prev => [...new Set([...prev, id])]);
  };

  const markAllAlertsAsRead = () => {
    const allIds = alerts.map(a => a.id);
    setReadAlertIds(allIds);
    addToast('info', 'Alertas Lidos', 'Todos os alertas foram marcados como lidos.');
  };

  const dispatchTestAlert = (channel: 'whatsapp' | 'email' | 'sms' | 'system') => {
    addToast(
      'success',
      'Alerta Enviado com Sucesso!',
      `Notificação de teste disparada para o canal ${channel.toUpperCase()} (${settings.whatsappNumber || '+258 84 123 4567'}).`
    );
  };

  // Simulation Handlers
  const saveSimulation = (sim: Omit<SimulationRecord, 'id' | 'createdAt'>): SimulationRecord => {
    const newRecord: SimulationRecord = {
      ...sim,
      id: `sim-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    setSimulations(prev => [newRecord, ...prev]);
    addToast('success', 'Simulação Guardada!', 'O cálculo foi adicionado ao seu histórico e está pronto para exportação.');
    return newRecord;
  };

  const deleteSimulation = (id: string) => {
    setSimulations(prev => prev.filter(s => s.id !== id));
    addToast('info', 'Simulação Removida', 'O registo foi eliminado do histórico.');
  };

  // Client Handlers
  const addClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`
    };
    setClients(prev => [...prev, newClient]);
    addToast('success', 'Cliente Adicionado!', `${clientData.name} foi adicionado à sua carteira de clientes.`);
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    addToast('info', 'Cliente Removido', 'O cliente foi removido da base de dados.');
  };

  // Settings Handlers
  const updateSettings = (data: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...data }));
    addToast('success', 'Definições Guardadas', 'As suas preferências foram actualizadas.');
  };

  const toggleNotificationChannel = (channel: keyof SystemSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [channel]: !prev.notifications[channel]
      }
    }));
  };

  const toggleAlertTiming = (timing: keyof SystemSettings['alertTiming']) => {
    setSettings(prev => ({
      ...prev,
      alertTiming: {
        ...prev.alertTiming,
        [timing]: !prev.alertTiming[timing]
      }
    }));
  };

  const connectWhatsApp = (phone: string) => {
    setSettings(prev => ({
      ...prev,
      whatsappNumber: phone,
      isWhatsAppConnected: true
    }));
    setIsWhatsAppModalOpen(false);
    addToast('success', 'WhatsApp Emparelhado!', `Alertas fiscais serão enviados para ${phone}.`);
  };

  const openAIAssistantWithPrompt = (prompt: string) => {
    setAiAssistantPrompt(prompt);
    setIsAIAssistantOpen(true);
  };

  const openPDFPreview = (sim: SimulationRecord) => {
    setPdfSimulationData(sim);
    setIsPDFModalOpen(true);
  };

  return (
    <AppStateContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        registerUser,
        logout,
        updateUser,
        obligations,
        markObligationPaid,
        addObligation,
        deleteObligation,
        loadStandardMozambiqueTemplate,
        clearAllUserData,
        alerts,
        unreadAlertsCount,
        markAlertAsRead,
        markAllAlertsAsRead,
        dispatchTestAlert,
        simulations,
        saveSimulation,
        deleteSimulation,
        activeSimulationResult,
        setActiveSimulationResult,
        activeSimulationInput,
        setActiveSimulationInput,
        clients,
        activeClient,
        setActiveClient,
        addClient,
        deleteClient,
        settings,
        updateSettings,
        toggleNotificationChannel,
        toggleAlertTiming,
        connectWhatsApp,
        isWhatsAppModalOpen,
        setIsWhatsAppModalOpen,
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        aiAssistantPrompt,
        openAIAssistantWithPrompt,
        isPDFModalOpen,
        setIsPDFModalOpen,
        pdfSimulationData,
        openPDFPreview,
        toasts,
        addToast,
        removeToast,
        simulatorStep,
        setSimulatorStep
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within an AppStateProvider');
  return context;
};
