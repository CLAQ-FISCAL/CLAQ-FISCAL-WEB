import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  FiscalObligation,
  AlertItem,
  Client,
  SimulationRecord,
  SystemSettings
} from '../types';
import {
  INITIAL_USER,
  INITIAL_SETTINGS,
  INITIAL_OBLIGATIONS,
  INITIAL_ALERTS,
  INITIAL_CLIENTS,
  INITIAL_SIMULATIONS
} from '../data/initialData';
import { NonResidentServiceResult } from '../data/taxEngine';

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
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;

  // Obligations
  obligations: FiscalObligation[];
  markObligationPaid: (id: string) => void;
  addObligation: (obl: Omit<FiscalObligation, 'id'>) => void;

  // Alerts
  alerts: AlertItem[];
  unreadAlertsCount: number;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  dispatchTestAlert: (channel: 'whatsapp' | 'email' | 'sms' | 'system') => void;

  // Simulations
  simulations: SimulationRecord[];
  saveSimulation: (sim: Omit<SimulationRecord, 'id' | 'createdAt'>) => SimulationRecord;
  deleteSimulation: (id: string) => void;
  activeSimulationResult: NonResidentServiceResult | null;
  setActiveSimulationResult: (res: NonResidentServiceResult | null) => void;
  activeSimulationInput: any;
  setActiveSimulationInput: (input: any) => void;

  // Clients
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
  // Load from local storage or defaults
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('claq_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('claq_auth') === 'true' || true; // default logged in for easy test/demo
  });

  const [obligations, setObligations] = useState<FiscalObligation[]>(() => {
    const saved = localStorage.getItem('claq_obligations');
    return saved ? JSON.parse(saved) : INITIAL_OBLIGATIONS;
  });

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem('claq_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [simulations, setSimulations] = useState<SimulationRecord[]>(() => {
    const saved = localStorage.getItem('claq_simulations');
    return saved ? JSON.parse(saved) : INITIAL_SIMULATIONS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('claq_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('claq_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [activeSimulationResult, setActiveSimulationResult] = useState<NonResidentServiceResult | null>(null);
  const [activeSimulationInput, setActiveSimulationInput] = useState<any>({
    providerName: 'Google LLC',
    providerCountry: 'Estados Unidos',
    currency: 'USD',
    invoiceAmount: 10000,
    exchangeRate: 63.75,
    paymentDate: '2026-07-15',
    description: 'Serviços de infraestrutura cloud e licenças de software corporativo'
  });

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfSimulationData, setPdfSimulationData] = useState<SimulationRecord | null>(null);
  const [simulatorStep, setSimulatorStep] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to local storage
  useEffect(() => {
    if (user) localStorage.setItem('claq_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('claq_obligations', JSON.stringify(obligations));
  }, [obligations]);

  useEffect(() => {
    localStorage.setItem('claq_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('claq_simulations', JSON.stringify(simulations));
  }, [simulations]);

  useEffect(() => {
    localStorage.setItem('claq_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('claq_settings', JSON.stringify(settings));
  }, [settings]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const login = (email: string, _password?: string): boolean => {
    setIsAuthenticated(true);
    localStorage.setItem('claq_auth', 'true');
    setUser(INITIAL_USER);
    addToast('success', 'Sessão Iniciada', `Bem-vindo de volta, ${INITIAL_USER.name}!`);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('claq_auth', 'false');
    addToast('info', 'Sessão Terminada', 'A sua sessão foi encerrada em segurança.');
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    addToast('success', 'Perfil Actualizado', 'As informações da sua conta foram guardadas com sucesso.');
  };

  const markObligationPaid = (id: string) => {
    setObligations(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'pago' as const } : o))
    );
    addToast('success', 'Obrigação Liquidada', 'A obrigação foi marcada como paga com sucesso.');
  };

  const addObligation = (obl: Omit<FiscalObligation, 'id'>) => {
    const newObl: FiscalObligation = {
      ...obl,
      id: `obl-${Date.now()}`
    };
    setObligations(prev => [newObl, ...prev]);
    addToast('success', 'Nova Obrigação Registada', `${newObl.title} adicionada ao calendário.`);
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllAlertsAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    addToast('info', 'Alertas Actualizados', 'Todos os alertas foram marcados como lidos.');
  };

  const dispatchTestAlert = (channel: 'whatsapp' | 'email' | 'sms' | 'system') => {
    const channelNames = {
      whatsapp: 'WhatsApp (+258 84 123 4567)',
      email: 'E-mail (carlos.apollo@claq.co.mz)',
      sms: 'SMS (+258 84 123 4567)',
      system: 'Notificação na Plataforma'
    };
    addToast(
      'success',
      'Alerta Disparado!',
      `Simulação de lembrete enviada via ${channelNames[channel]}: "IVA Junho/2026 vence em 3 dias".`
    );
  };

  const saveSimulation = (sim: Omit<SimulationRecord, 'id' | 'createdAt'>): SimulationRecord => {
    const newRecord: SimulationRecord = {
      ...sim,
      id: `sim-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    setSimulations(prev => [newRecord, ...prev]);
    addToast('success', 'Simulação Guardada', 'O registo foi adicionado ao seu histórico de cálculos.');
    return newRecord;
  };

  const deleteSimulation = (id: string) => {
    setSimulations(prev => prev.filter(s => s.id !== id));
    addToast('info', 'Registo Removido', 'A simulação foi eliminada do histórico.');
  };

  const addClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`
    };
    setClients(prev => [newClient, ...prev]);
    addToast('success', 'Cliente Cadastrado', `${newClient.name} foi adicionado à sua carteira.`);
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    addToast('info', 'Cliente Removido', 'O cliente foi removido da sua carteira.');
  };

  const updateSettings = (data: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...data }));
    addToast('success', 'Preferências Guardadas', 'As suas preferências de notificação foram actualizadas.');
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
    addToast('success', 'WhatsApp Conectado! 🎉', `Alertas automáticos activados para o número ${phone}`);
  };

  const openAIAssistantWithPrompt = (prompt: string) => {
    setAiAssistantPrompt(prompt);
    setIsAIAssistantOpen(true);
  };

  const openPDFPreview = (sim: SimulationRecord) => {
    setPdfSimulationData(sim);
    setIsPDFModalOpen(true);
  };

  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <AppStateContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        updateUser,
        obligations,
        markObligationPaid,
        addObligation,
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
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
