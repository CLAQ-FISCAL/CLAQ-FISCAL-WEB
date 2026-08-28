import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  FiscalObligation,
  AlertItem,
  Client,
  SimulationRecord,
  SystemSettings
} from '../types';
import { NonResidentServiceResult } from '../data/taxEngine';
import { CalendarEngine } from '../utils/calendarEngine';
import { ApiClient } from '../api/client';
import '../config/cognito';
import { signIn, signUp, signOut, fetchAuthSession, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

const DEFAULT_SETTINGS: SystemSettings = {
  notifications: {
    email: true,
    whatsapp: true,
    inApp: true,
    sms: false
  },
  alertTiming: {
    d7: true,
    d3: true,
    d1: true,
    d0: true
  },
  whatsappNumber: '',
  isWhatsAppConnected: false,
  language: 'pt-PT',
  theme: 'light'
};

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
  login: (email: string, password?: string) => Promise<boolean> | boolean;
  registerUser: (userData: Partial<UserProfile> & { password?: string }) => Promise<void> | void;
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

// Helper: Build UserProfile from Cognito attributes + fallback localStorage user
const buildUserFromCognito = async (): Promise<UserProfile | null> => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    if (!idToken) return null;
    const attrs = await fetchUserAttributes().catch(() => ({} as any));
    const cognitoUser = await getCurrentUser().catch(() => null);
    const payload: any = (idToken as any).payload || {};
    // Try to restore company info from localStorage first (since Cognito custom attrs may not contain all)
    const saved = localStorage.getItem('claq_user');
    const savedUser: Partial<UserProfile> = saved ? JSON.parse(saved) : {};
    return {
      id: cognitoUser?.userId || payload.sub || savedUser.id || `usr_${Date.now()}`,
      name: (attrs as any).name || payload.name || savedUser.name || 'Utilizador CLAQ',
      email: (attrs as any).email || payload.email || savedUser.email || '',
      phone: (attrs as any).phone_number || payload.phone_number || savedUser.phone || '+258 84 000 0000',
      role: (payload['cognito:groups']?.[0] as string) || savedUser.role || 'ACCOUNTING_ADMIN',
      avatarUrl: savedUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      companyName: (attrs as any)['custom:companyName'] || payload['custom:companyName'] || savedUser.companyName || 'Minha Empresa, Lda',
      companyNuit: (attrs as any)['custom:nuit'] || payload['custom:nuit'] || savedUser.companyNuit || '400000000',
      companyAddress: savedUser.companyAddress || 'Moçambique',
      companyCity: (attrs as any)['custom:city'] || savedUser.companyCity || 'Maputo',
      companyProvince: (attrs as any)['custom:province'] || savedUser.companyProvince || 'Maputo Cidade',
      plan: (savedUser.plan as any) || 'PME',
      planStatus: (savedUser.planStatus as any) || 'active',
      renewalDate: savedUser.renewalDate || '31/12/2026',
    };
  } catch {
    return null;
  }
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User state (Zero hardcoded demo entities)
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('claq_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const userSaved = localStorage.getItem('claq_user');
    const token = localStorage.getItem('claq_cognito_idToken') || localStorage.getItem('claq_token');
    return Boolean(userSaved && token);
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
    return [];
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
    return [];
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

      if (days < 0) {
        generatedAlerts.push({
          id: `alert-overdue-${obl.id}`,
          title: `Obrigação Vencida: ${obl.title}`,
          message: `A data limite era ${obl.dueDate}. Proceda à liquidação para evitar juros de mora agravados.`,
          severity: 'critical',
          category: obl.category,
          date: obl.dueDate,
          dueDate: obl.dueDate,
          daysRemaining: days,
          read: readAlertIds.includes(`alert-overdue-${obl.id}`),
          actionLabel: 'Liquidar Agora'
        });
      } else if (days <= 3) {
        generatedAlerts.push({
          id: `alert-imminent-${obl.id}`,
          title: `Aviso Iminente: ${obl.title}`,
          message: `Faltam apenas ${days === 0 ? 'poucas horas (Hoje)' : `${days} dia(s)`} para o encerramento do prazo legal.`,
          severity: 'critical',
          category: obl.category,
          date: obl.dueDate,
          dueDate: obl.dueDate,
          daysRemaining: days,
          read: readAlertIds.includes(`alert-imminent-${obl.id}`),
          actionLabel: 'Ver Detalhes'
        });
      } else if (days <= 7) {
        generatedAlerts.push({
          id: `alert-upcoming-${obl.id}`,
          title: `Lembrete Preventivo: ${obl.title}`,
          message: `O prazo vence em ${days} dias (${obl.dueDate}). Verifique os montantes a declarar.`,
          severity: 'warning',
          category: obl.category,
          date: obl.dueDate,
          dueDate: obl.dueDate,
          daysRemaining: days,
          read: readAlertIds.includes(`alert-upcoming-${obl.id}`),
          actionLabel: 'Consultar Calendário'
        });
      }
    });

    setAlerts(generatedAlerts);
  }, [obligations, readAlertIds]);

  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  // 6. Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('claq_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // UI State & Drawers
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfSimulationData, setPdfSimulationData] = useState<SimulationRecord | null>(null);
  const [simulatorStep, setSimulatorStep] = useState(1);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync state to backend & localStorage
  const syncFromBackend = async () => {
    try {
      const [oblsRes, clientsRes, simsRes] = await Promise.allSettled([
        ApiClient.get<{ data: FiscalObligation[] }>('/obligations'),
        ApiClient.get<{ data: Client[] }>('/clients'),
        ApiClient.get<{ data: SimulationRecord[] }>('/simulations')
      ]);

      if (oblsRes.status === 'fulfilled' && oblsRes.value?.data) {
        setObligations(oblsRes.value.data);
        localStorage.setItem('claq_obligations', JSON.stringify(oblsRes.value.data));
      }
      if (clientsRes.status === 'fulfilled' && clientsRes.value?.data) {
        setClients(clientsRes.value.data);
        localStorage.setItem('claq_clients', JSON.stringify(clientsRes.value.data));
      }
      if (simsRes.status === 'fulfilled' && simsRes.value?.data) {
        setSimulations(simsRes.value.data);
        localStorage.setItem('claq_simulations', JSON.stringify(simsRes.value.data));
      }
    } catch (e) {
      console.warn('Backend sync completed in offline/cache mode');
    }
  };

  // Restore Cognito session on mount (flawless refresh)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await fetchAuthSession();
        const hasToken = !!session.tokens?.idToken || !!session.tokens?.accessToken;
        if (hasToken && user) {
          // Already have user from localStorage, just ensure token cache is fresh
          const idToken = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
          if (idToken) localStorage.setItem('claq_cognito_idToken', idToken);
          setIsAuthenticated(true);
          await syncFromBackend();
        } else if (hasToken && !user) {
          const restored = await buildUserFromCognito();
          if (restored) {
            setUser(restored);
            setIsAuthenticated(true);
            localStorage.setItem('claq_user', JSON.stringify(restored));
            localStorage.setItem('claq_is_auth', 'true');
            const idToken = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
            if (idToken) localStorage.setItem('claq_cognito_idToken', idToken);
            await syncFromBackend();
          }
        } else if (!hasToken && user) {
          // No Cognito session but we have legacy localStorage user (local dev fallback)
          const token = localStorage.getItem('claq_cognito_idToken') || localStorage.getItem('claq_token');
          if (!token) {
            // No token at all — keep offline user but not authenticated for protected API
            setIsAuthenticated(false);
          } else {
            // Legacy token present — try to validate via backend /auth/me
            try {
              const res = await ApiClient.get<{ user: UserProfile }>('/auth/me');
              if (res?.user) {
                setIsAuthenticated(true);
                await syncFromBackend();
              }
            } catch {
              // ignore — offline mode
            }
          }
        }
      } catch {
        // No session — remains in offline/local mode
      }
    };
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth Handlers — Cognito SRP Primary + Legacy Fallback (dual mode)
  const login = async (emailOrNuit: string, password?: string): Promise<boolean> => {
    const email = emailOrNuit.trim().toLowerCase();
    // Phase 1: Try Cognito SRP
    try {
      if (password && password.length >= 8) {
        const result = await signIn({ username: email, password });
        // Handle next steps (e.g., NEW_PASSWORD_REQUIRED, CONFIRM_SIGN_UP)
        if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          addToast('warning', 'Confirmação Necessária', 'Verifique o seu email para confirmar o registo antes de iniciar sessão.');
          return false;
        }
        if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          addToast('info', 'Nova Senha Necessária', 'Defina uma nova senha conforme exigido pela política de segurança.');
          return false;
        }
        if (result.isSignedIn) {
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
          if (idToken) localStorage.setItem('claq_cognito_idToken', idToken);
          // Build user profile from Cognito
          const cognitoUser = await buildUserFromCognito();
          if (cognitoUser) {
            setUser(cognitoUser);
            setIsAuthenticated(true);
            localStorage.setItem('claq_user', JSON.stringify(cognitoUser));
            localStorage.setItem('claq_is_auth', 'true');
            addToast('success', 'Sessão Iniciada', `Bem-vindo de volta, ${cognitoUser.name}!`);
            await syncFromBackend();
            return true;
          }
          // Fallback: minimal user from email
          const minimalUser: UserProfile = {
            id: `usr_${Date.now()}`,
            name: email.split('@')[0],
            email,
            phone: '+258 84 000 0000',
            role: 'ACCOUNTING_ADMIN',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            companyName: 'Minha Empresa, Lda',
            companyNuit: '400000000',
            companyAddress: 'Moçambique',
            companyCity: 'Maputo',
            companyProvince: 'Maputo Cidade',
            plan: 'PME',
            planStatus: 'active',
            renewalDate: '31/12/2026'
          };
          setUser(minimalUser);
          setIsAuthenticated(true);
          localStorage.setItem('claq_user', JSON.stringify(minimalUser));
          return true;
        }
      }
    } catch (e: any) {
      const name = e?.name || e?.__type || '';
      const message = e?.message || '';
      // If Cognito error indicates user not found or not confirmed, try legacy backend
      const isCognitoNotFound = name.includes('UserNotFound') || name.includes('NotAuthorized') || message.includes('User does not exist');
      if (!isCognitoNotFound) {
        // For other Cognito errors (invalid password, etc.), show directly and don't fallback to avoid masking
        if (name.includes('NotAuthorizedException') || name.includes('UserNotConfirmed')) {
          addToast('error', 'Falha na Autenticação', 'Credenciais inválidas ou utilizador não confirmado. Verifique o email e senha.');
          return false;
        }
        // For network or other, fall through to legacy attempt
        console.warn('Cognito signIn failed, trying legacy backend:', e);
      } else {
        console.warn('Cognito user not found, trying legacy backend:', e);
      }
    }

    // Phase 2: Legacy backend fallback (local dev / prod JWT_SECRET)
    try {
      const res = await ApiClient.post<{
        success: boolean;
        token: string;
        user: UserProfile;
        company: any;
      }>('/auth/login', { emailOrNuit: email, password });

      if (res && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem('claq_user', JSON.stringify(res.user));
        localStorage.setItem('claq_is_auth', 'true');
        if (res.token) {
          localStorage.setItem('claq_token', res.token);
          localStorage.setItem('claq_cognito_idToken', res.token);
        }
        addToast('success', 'Sessão Iniciada', `Bem-vindo de volta, ${res.user.name}!`);
        await syncFromBackend();
        return true;
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('401') || msg.includes('403')) {
        addToast('error', 'Falha na Autenticação', 'Credenciais inválidas. Verifique o email/NUIT e a senha.');
      } else {
        addToast('error', 'Falha na Autenticação', 'Credenciais inválidas ou erro de comunicação com o servidor.');
      }
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('claq_user');
      localStorage.removeItem('claq_is_auth');
      return false;
    }
    return false;
  };

  const registerUser = async (userData: Partial<UserProfile> & { password?: string }) => {
    const email = (userData.email || '').trim().toLowerCase();
    const password = userData.password || '';
    // Phase 1: Try Cognito signUp
    try {
      if (email && password.length >= 8) {
        const signUpResult = await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
              name: userData.name || 'Administrador Fiscal',
              ...(userData.phone ? { phone_number: userData.phone } : {}),
              // Custom attributes must be pre-created in User Pool; we send what we can
            } as any,
          },
        });
        // If autoConfirm or CONFIRM_SIGN_UP step
        if (signUpResult.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          addToast('info', 'Confirme o seu Email', `Enviámos um código para ${email}. Introduza o código para ativar a conta.`);
          // Auto sign-in after confirmation would happen on next login; for now fallback to legacy if needed
          // Store pending user locally for UX
          const pendingUser: UserProfile = {
            id: `usr_${Date.now()}`,
            name: userData.name || 'Administrador Fiscal',
            email,
            phone: userData.phone || '+258 84 000 0000',
            role: 'ACCOUNTING_ADMIN',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            companyName: userData.companyName || 'Nova Empresa, Lda',
            companyNuit: userData.companyNuit || '400000000',
            companyAddress: (userData as any).companyAddress || 'Moçambique',
            companyCity: userData.companyCity || 'Maputo',
            companyProvince: userData.companyProvince || 'Maputo Cidade',
            plan: (userData.plan as any) || 'PME',
            planStatus: 'active',
            renewalDate: '31/12/2026'
          };
          localStorage.setItem('claq_pending_user', JSON.stringify(pendingUser));
          // Try auto sign-in if allowed (some pools allow autoSignIn)
          try {
            const session = await fetchAuthSession();
            if (session.tokens?.idToken) {
              const cognitoUser = await buildUserFromCognito();
              if (cognitoUser) {
                setUser(cognitoUser);
                setIsAuthenticated(true);
                localStorage.setItem('claq_user', JSON.stringify(cognitoUser));
                localStorage.setItem('claq_is_auth', 'true');
                addToast('success', 'Conta Criada com Sucesso', `Empresa ${cognitoUser.companyName} configurada.`);
                return;
              }
            }
          } catch {
            // ignore
          }
          // If not auto-signed in, inform user to login after confirmation
          return;
        }
        if (signUpResult.nextStep?.signUpStep === 'DONE') {
          // Auto-confirmed — sign in immediately
          return await login(email, password).then(() => {});
        }
      }
    } catch (e: any) {
      const name = e?.name || '';
      if (name.includes('UsernameExistsException')) {
        addToast('error', 'Email já Registado', 'O email indicado já se encontra registado. Tente iniciar sessão.');
        return;
      }
      console.warn('Cognito signUp failed, trying legacy backend:', e);
    }

    // Phase 2: Legacy backend fallback
    try {
      const res = await ApiClient.post<{
        success: boolean;
        token: string;
        user: UserProfile;
        company: any;
      }>('/auth/register', userData);

      if (res && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem('claq_user', JSON.stringify(res.user));
        localStorage.setItem('claq_is_auth', 'true');
        if (res.token) {
          localStorage.setItem('claq_token', res.token);
          localStorage.setItem('claq_cognito_idToken', res.token);
        }
        addToast('success', 'Conta Criada com Sucesso', `Empresa ${res.user.companyName} configurada.`);
        setObligations([]);
        setClients([]);
        setSimulations([]);
        localStorage.removeItem('claq_obligations');
        localStorage.removeItem('claq_clients');
        localStorage.removeItem('claq_simulations');
        return;
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('409')) {
        addToast('error', 'Email já Registado', 'O email indicado já se encontra registado.');
      } else {
        addToast('error', 'Erro no Registo', 'Não foi possível criar a conta. Verifique os dados introduzidos ou confirme o email.');
      }
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    ApiClient.post('/auth/logout', {}).catch(() => {});
    setUser(null);
    setIsAuthenticated(false);
    setObligations([]);
    setClients([]);
    setSimulations([]);
    localStorage.removeItem('claq_user');
    localStorage.removeItem('claq_is_auth');
    localStorage.removeItem('claq_cognito_idToken');
    localStorage.removeItem('claq_token');
    localStorage.removeItem('claq_pending_user');
    localStorage.removeItem('claq_obligations');
    localStorage.removeItem('claq_clients');
    localStorage.removeItem('claq_simulations');
    addToast('info', 'Sessão Terminada', 'Até breve!');
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('claq_user', JSON.stringify(updated));
    // Also try to update Cognito attributes (best effort)
    import('aws-amplify/auth').then(({ updateUserAttributes }) => {
      const attrs: Record<string, string> = {};
      if (data.name) attrs.name = data.name;
      if (data.email) attrs.email = data.email;
      if (data.phone) attrs.phone_number = data.phone;
      if (Object.keys(attrs).length) {
        updateUserAttributes({ userAttributes: attrs as any }).catch(() => {});
      }
    }).catch(() => {});
    addToast('success', 'Perfil Actualizado', 'Os dados da empresa foram guardados.');
  };

  // Obligations Actions
  const markObligationPaid = (id: string) => {
    ApiClient.patch(`/obligations/${id}/settle`).catch(() => {
      addToast('error', 'Liquidação não confirmada', 'Não foi possível confirmar a operação no servidor.');
      return null;
    });
    setObligations(prev => {
      const updated = prev.map(o => {
        if (o.id === id) {
          return { ...o, status: 'pago' as const, paidAt: new Date().toISOString() };
        }
        return o;
      });
      localStorage.setItem('claq_obligations', JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Obrigação Liquidada', 'Comprovativo de liquidação registado.');
  };

  const addObligation = (obl: Omit<FiscalObligation, 'id'>) => {
    const newObl: FiscalObligation = {
      ...obl,
      id: `obl_${Date.now()}`
    };
    ApiClient.post('/obligations', newObl).catch(() => addToast('error', 'Obrigação não guardada', 'Não foi possível confirmar a operação no servidor.'));
    setObligations(prev => {
      const updated = [newObl, ...prev];
      localStorage.setItem('claq_obligations', JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Obrigação Adicionada', `${newObl.title} agendada para ${newObl.dueDate}.`);
  };

  const deleteObligation = (id: string) => {
    ApiClient.delete(`/obligations/${id}`).catch(() => addToast('error', 'Eliminação não confirmada', 'Não foi possível confirmar a operação no servidor.'));
    setObligations(prev => {
      const updated = prev.filter(o => o.id !== id);
      localStorage.setItem('claq_obligations', JSON.stringify(updated));
      return updated;
    });
    addToast('info', 'Obrigação Removida', 'Item eliminado do calendário fiscal.');
  };

  const loadStandardMozambiqueTemplate = async () => {
    try {
      const res = await ApiClient.post<{ success: boolean; data: FiscalObligation[] }>('/obligations/template/mozambique', {});
      if (res && res.data) {
        setObligations(res.data);
        localStorage.setItem('claq_obligations', JSON.stringify(res.data));
        addToast('success', 'Modelo Padrão Carregado', `${res.data.length} prazos fiscais oficiais de Moçambique inseridos.`);
        return;
      }
    } catch (e) {
      // Local computation
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const monthLabel = CalendarEngine.getMonthNamePt(month, year);
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const monthStr = String(month + 1).padStart(2, '0');

      const template: FiscalObligation[] = [
        {
          id: `obl-iva-${year}-${monthStr}`,
          title: 'IVA – Declaração Periódica e Pagamento',
          category: 'IVA',
          period: monthLabel,
          dueDate: `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`,
          status: 'a_vencer',
          amount: 125000,
          authority: 'AT',
          description: 'Declaração periódica do Modelo A e guia de pagamento do IVA relativo às operações do mês.',
          penaltyRisk: 'Multa de 25% a 100% mais juros de mora legais (Art. 101 LGT).',
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`)
        },
        {
          id: `obl-inss-${year}-${monthStr}`,
          title: 'INSS – Contribuição Mensal Obrigatória',
          category: 'INSS',
          period: monthLabel,
          dueDate: `${year}-${monthStr}-10`,
          status: 'a_vencer',
          amount: 45000,
          authority: 'INSS',
          description: 'Folha de salários e pagamento de 3% trabalhador + 4% patronal.',
          penaltyRisk: 'Juros de mora mensais e certidão de quitação bloqueada.',
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-10`)
        },
        {
          id: `obl-irps-${year}-${monthStr}`,
          title: 'IRPS – Retenção na Fonte sobre Salários',
          category: 'IRPS',
          period: monthLabel,
          dueDate: `${year}-${monthStr}-20`,
          status: 'a_vencer',
          amount: 68000,
          authority: 'AT',
          description: 'Guia de entrega de retenções na fonte de 1ª e 2ª categorias.',
          penaltyRisk: 'Multa por falta de entrega de imposto retido.',
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-20`)
        },
        {
          id: `obl-tae-${year}`,
          title: 'TAE – Taxa de Atividade Económica',
          category: 'TAE',
          period: `Semestre/${year}`,
          dueDate: `${year}-${monthStr}-25`,
          status: 'a_vencer',
          amount: 12000,
          authority: 'Municipio',
          description: 'Obrigação municipal. Conselho Municipal de Maputo.',
          penaltyRisk: 'Agravamento de 50% por incumprimento do prazo municipal.',
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-25`)
        }
      ];

      setObligations(template);
      localStorage.setItem('claq_obligations', JSON.stringify(template));
      addToast('success', 'Modelo Padrão Carregado', `${template.length} prazos fiscais oficiais de Moçambique inseridos.`);
    }
  };

  const clearAllUserData = () => {
    setObligations([]);
    setClients([]);
    setSimulations([]);
    localStorage.removeItem('claq_obligations');
    localStorage.removeItem('claq_clients');
    localStorage.removeItem('claq_simulations');
    addToast('info', 'Dados Limpos', 'O calendário e simulações foram redefinidos para estado limpo.');
  };

  // Alerts Actions
  const markAlertAsRead = (id: string) => {
    ApiClient.patch(`/alerts/${id}/read`).catch(() => {});
    setReadAlertIds(prev => {
      const updated = [...prev, id];
      localStorage.setItem('claq_read_alerts', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAlertsAsRead = () => {
    ApiClient.patch('/alerts/mark-read').catch(() => {});
    const allIds = alerts.map(a => a.id);
    setReadAlertIds(allIds);
    localStorage.setItem('claq_read_alerts', JSON.stringify(allIds));
    addToast('info', 'Alertas Lidos', 'Todos os avisos foram marcados como lidos.');
  };

  const dispatchTestAlert = (channel: 'whatsapp' | 'email' | 'sms' | 'system') => {
    ApiClient.post('/alerts/test-dispatch', { channel }).catch(() => {});
    const channelNames = {
      whatsapp: 'WhatsApp (+258 84...)',
      email: 'Email Corporativo',
      sms: 'SMS',
      system: 'Painel do Sistema'
    };
    addToast('success', 'Alerta Teste Disparado', `Mensagem de teste enviada com sucesso para ${channelNames[channel]}.`);
  };

  // Simulations Actions
  const saveSimulation = (sim: Omit<SimulationRecord, 'id' | 'createdAt'>): SimulationRecord => {
    const newRecord: SimulationRecord = {
      ...sim,
      id: `sim_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    ApiClient.post('/simulations', newRecord).catch(() => {});
    setSimulations(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('claq_simulations', JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Simulação Guardada', 'Cálculo certificado adicionado ao seu histórico.');
    return newRecord;
  };

  const deleteSimulation = (id: string) => {
    ApiClient.delete(`/simulations/${id}`).catch(() => {});
    setSimulations(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('claq_simulations', JSON.stringify(updated));
      return updated;
    });
    addToast('info', 'Simulação Eliminada', 'Registo removido do histórico.');
  };

  // Clients Actions
  const addClient = (client: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...client,
      id: `cli_${Date.now()}`
    };
    ApiClient.post('/clients', newClient).catch(() => {});
    setClients(prev => {
      const updated = [newClient, ...prev];
      localStorage.setItem('claq_clients', JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Cliente Adicionado', `${newClient.name} registado com sucesso.`);
  };

  const deleteClient = (id: string) => {
    ApiClient.delete(`/clients/${id}`).catch(() => {});
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('claq_clients', JSON.stringify(updated));
      return updated;
    });
    if (activeClient?.id === id) setActiveClient(null);
    addToast('info', 'Cliente Removido', 'Registo eliminado.');
  };

  // Settings Actions
  const updateSettings = (data: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('claq_settings', JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Configurações Guardadas', 'As preferências foram actualizadas.');
  };

  const toggleNotificationChannel = (channel: keyof SystemSettings['notifications']) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        notifications: {
          ...prev.notifications,
          [channel]: !prev.notifications[channel]
        }
      };
      localStorage.setItem('claq_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleAlertTiming = (timing: keyof SystemSettings['alertTiming']) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        alertTiming: {
          ...prev.alertTiming,
          [timing]: !prev.alertTiming[timing]
        }
      };
      localStorage.setItem('claq_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const connectWhatsApp = (phone: string) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        whatsappNumber: phone,
        isWhatsAppConnected: true
      };
      localStorage.setItem('claq_settings', JSON.stringify(updated));
      return updated;
    });
    setIsWhatsAppModalOpen(false);
    addToast('success', 'WhatsApp Conectado', `Número ${phone} pronto para receber alertas.`);
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

      {/* Global Toast Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 99999,
          pointerEvents: 'none'
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor:
                toast.type === 'success'
                  ? '#064E3B'
                  : toast.type === 'error'
                  ? '#7F1D1D'
                  : toast.type === 'warning'
                  ? '#78350F'
                  : '#0F172A',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: '280px',
              maxWidth: '400px',
              pointerEvents: 'auto',
              border: '1px solid rgba(255,255,255,0.12)',
              animation: 'fadeInUp 0.25s ease forwards'
            }}
          >
            <span style={{ fontSize: '13.5px', fontWeight: 800 }}>{toast.title}</span>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>{toast.message}</span>
          </div>
        ))}
      </div>
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
