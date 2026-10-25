import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  FiscalObligation,
  AlertItem,
  Client,
  SimulationRecord,
  SimulationReport,
  SystemSettings,
  Tenant
} from '../types';
import { NonResidentServiceResult } from '../data/taxEngine';
import { CalendarEngine } from '../utils/calendarEngine';
import { ApiClient } from '../api/client';
import i18n, { AppLanguage, isSupportedLanguage } from '../i18n';
import '../config/cognito';
import { signIn, signUp, confirmSignUp as cognitoConfirmSignUp, resendSignUpCode, signOut, fetchAuthSession, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

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
  language: 'pt',
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
  registerUser: (userData: Partial<UserProfile> & { password?: string; selectedPlanCode?: string }, options?: { signInAfterRegister?: boolean }) => Promise<boolean | 'confirmation-required'>;
  confirmRegistration: (email: string, code: string) => Promise<boolean>;
  resendRegistrationCode: (email: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;

  // Tenants (authoritative from /v1/me) — drives X-Tenant-Id for multi-tenant users
  tenants: Tenant[];
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;

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
  markAllAlertsAsRead: (companyId?: string | null) => void;
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

  // Language
  language: AppLanguage;
  setLanguage: (lng: AppLanguage) => void;

  // Modals and Drawers
  isWhatsAppModalOpen: boolean;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;
  aiAssistantPrompt: string;
  openAIAssistantWithPrompt: (prompt: string) => void;
  isPDFModalOpen: boolean;
  setIsPDFModalOpen: (open: boolean) => void;
  pdfSimulationData: SimulationReport | null;
  openPDFPreview: (report: SimulationReport) => void;

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
    const pending = localStorage.getItem('claq_pending_user');
    const parsedSaved: Partial<UserProfile> = saved ? JSON.parse(saved) : {};
    const parsedPending: Partial<UserProfile> = pending ? JSON.parse(pending) : {};
    const cognitoEmail = (attrs as any).email || payload.email || '';
    const savedUser = parsedPending.email?.toLowerCase() === cognitoEmail.toLowerCase() ? parsedPending : parsedSaved;
    return {
      id: cognitoUser?.userId || payload.sub || savedUser.id || `usr_${Date.now()}`,
      name: (attrs as any).name || payload.name || savedUser.name || i18n.t('state:userFallback'),
      email: cognitoEmail || savedUser.email || '',
      phone: (attrs as any).phone_number || payload.phone_number || savedUser.phone || '+258 84 000 0000',
      role: (payload['cognito:groups']?.[0] as string) || savedUser.role || 'ACCOUNTING_ADMIN',
      avatarUrl: savedUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      companyName: (attrs as any)['custom:companyName'] || payload['custom:companyName'] || savedUser.companyName || i18n.t('state:companyFallback'),
      companyNuit: (attrs as any)['custom:nuit'] || payload['custom:nuit'] || savedUser.companyNuit || '400000000',
      companyAddress: savedUser.companyAddress || i18n.t('state:country'),
      companyCity: (attrs as any)['custom:city'] || savedUser.companyCity || i18n.t('state:cityMaputo'),
      companyProvince: (attrs as any)['custom:province'] || savedUser.companyProvince || i18n.t('state:cityMaputoCidade'),
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

  const [activeClient, setActiveClientState] = useState<Client | null>(() => {
    const activeId = localStorage.getItem('claq_active_client');
    const saved = localStorage.getItem('claq_clients');
    if (!activeId || !saved) return null;
    try {
      return (JSON.parse(saved) as Client[]).find(client => client.id === activeId) ?? null;
    } catch {
      return null;
    }
  });

  const setActiveClient = (client: Client | null) => {
    setActiveClientState(client);
    if (client) localStorage.setItem('claq_active_client', client.id);
    else localStorage.removeItem('claq_active_client');
  };

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
          title: i18n.t('state:alertOverdueTitle', { title: obl.title }),
          message: i18n.t('state:alertOverdueMsg', { dueDate: obl.dueDate }),
          severity: 'critical',
          category: obl.category,
          companyId: obl.companyId ?? null,
          date: obl.dueDate,
          dueDate: obl.dueDate,
          daysRemaining: days,
          read: readAlertIds.includes(`alert-overdue-${obl.id}`),
          actionLabel: i18n.t('state:payNow')
        });
      } else if (days <= 3) {
        generatedAlerts.push({
          id: `alert-imminent-${obl.id}`,
          title: i18n.t('state:alertImminentTitle', { title: obl.title }),
          message: i18n.t('state:alertImminentMsg', {
            daysLabel: days === 0
              ? i18n.t('state:hoursToday')
              : i18n.t('state:xDays', { count: days })
          }),
          severity: 'critical',
          category: obl.category,
          companyId: obl.companyId ?? null,
          date: obl.dueDate,
          dueDate: obl.dueDate,
          daysRemaining: days,
          read: readAlertIds.includes(`alert-imminent-${obl.id}`),
          actionLabel: i18n.t('state:viewDetails')
        });
      } else if (days <= 7) {
        generatedAlerts.push({
          id: `alert-upcoming-${obl.id}`,
          title: i18n.t('state:alertUpcomingTitle', { title: obl.title }),
          message: i18n.t('state:alertUpcomingMsg', { days, dueDate: obl.dueDate }),
          severity: 'warning',
          category: obl.category,
          companyId: obl.companyId ?? null,
          date: obl.dueDate,
          dueDate: obl.dueDate,
          daysRemaining: days,
          read: readAlertIds.includes(`alert-upcoming-${obl.id}`),
          actionLabel: i18n.t('state:consultCalendar')
        });
      }
    });

    setAlerts(generatedAlerts);
  }, [obligations, readAlertIds]);

  const unreadAlertsCount = alerts.filter(a => !a.read && (a.companyId ?? null) === (activeClient?.id ?? null)).length;

  // 6. Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('claq_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.language = parsed.language === 'pt-PT' ? 'pt' : parsed.language;
        if (!isSupportedLanguage(parsed.language)) parsed.language = 'pt';
        return parsed;
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 6b. Language (single source of truth = claq_language, fallback to settings)
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const stored = localStorage.getItem('claq_language');
    if (isSupportedLanguage(stored)) return stored;
    return isSupportedLanguage(settings.language) ? settings.language : 'pt';
  });

  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language);
    document.documentElement.lang = language === 'pt' ? 'pt' : 'en';
    localStorage.setItem('claq_language', language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (isSupportedLanguage(i18n.language)) {
      setLanguageState(i18n.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const setLanguage = (lng: AppLanguage) => {
    setLanguageState(lng);
    localStorage.setItem('claq_language', lng);
    setSettings(prev => {
      const updated = { ...prev, language: lng };
      localStorage.setItem('claq_settings', JSON.stringify(updated));
      return updated;
    });
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng === 'pt' ? 'pt' : 'en';
  };

  // UI State & Drawers
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfSimulationData, setPdfSimulationData] = useState<SimulationReport | null>(null);
  const [simulatorStep, setSimulatorStep] = useState(1);

  // Tenant context (resolved from /v1/me after auth)
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('claq_tenants');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(() =>
    localStorage.getItem('claq_active_tenant')
  );

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

  // Resolve tenants from /v1/me and pick the active tenant (drives X-Tenant-Id)
  const bootstrapTenants = async () => {
    try {
      const me = await ApiClient.getMe();
      const list = me?.tenants ?? [];
      setTenants(list);
      localStorage.setItem('claq_tenants', JSON.stringify(list));

      const stored = localStorage.getItem('claq_active_tenant');
      const storedValid = stored && list.some(t => t.id === stored) ? stored : null;
      const next = storedValid ?? list[0]?.id ?? null;

      if (next) {
        localStorage.setItem('claq_active_tenant', next);
        setActiveTenantIdState(next);
      } else {
        localStorage.removeItem('claq_active_tenant');
        setActiveTenantIdState(null);
      }
    } catch {
      // Offline / endpoint unavailable — keep any previously stored tenant
    }
  };

  // Sync state to backend & localStorage
  const syncFromBackend = async () => {
    await bootstrapTenants();
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
          addToast('warning', i18n.t('state:authConfirmTitle'), i18n.t('state:authConfirmMsg'));
          return false;
        }
        if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          addToast('info', i18n.t('state:authNewPasswordTitle'), i18n.t('state:authNewPasswordMsg'));
          return false;
        }
        if (result.isSignedIn) {
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
          if (idToken) localStorage.setItem('claq_cognito_idToken', idToken);
          // Build user profile from Cognito
          const cognitoUser = await buildUserFromCognito();
          if (cognitoUser) {
            localStorage.removeItem('claq_pending_user');
            setUser(cognitoUser);
            setIsAuthenticated(true);
            localStorage.setItem('claq_user', JSON.stringify(cognitoUser));
            localStorage.setItem('claq_is_auth', 'true');
            addToast('success', i18n.t('state:sessionStartedTitle'), i18n.t('state:sessionStartedMsg', { name: cognitoUser.name }));
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
            companyName: i18n.t('state:companyFallback'),
            companyNuit: '400000000',
            companyAddress: i18n.t('state:country'),
            companyCity: i18n.t('state:cityMaputo'),
            companyProvince: i18n.t('state:cityMaputoCidade'),
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
          addToast('error', i18n.t('state:authFailTitle'), i18n.t('state:authFailInvalidMsg'));
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
        addToast('success', i18n.t('state:sessionStartedTitle'), i18n.t('state:sessionStartedMsg', { name: res.user.name }));
        await syncFromBackend();
        return true;
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('401') || msg.includes('403')) {
        addToast('error', i18n.t('state:authFailTitle'), i18n.t('state:authFailGenericMsg'));
      } else {
        addToast('error', i18n.t('state:authFailTitle'), i18n.t('state:authFailServerMsg'));
      }
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('claq_user');
      localStorage.removeItem('claq_is_auth');
      return false;
    }
    return false;
  };

  const registerUser = async (userData: Partial<UserProfile> & { password?: string; selectedPlanCode?: string }, options: { signInAfterRegister?: boolean } = {}) => {
    const signInAfterRegister = options.signInAfterRegister ?? true;
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
              name: userData.name || i18n.t('state:adminFiscalDefault'),
                // Phone is intentionally not sent to Cognito: demo signup uses email confirmation only.
                // Custom attributes must be pre-created in the User Pool before they can be sent.
              } as any,
          },
        });
        // If autoConfirm or CONFIRM_SIGN_UP step
        if (signUpResult.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          addToast('info', i18n.t('state:confirmEmailTitle'), i18n.t('state:confirmEmailMsg', { email }));
          // Retain the profile locally until the user confirms their email and completes payment.
          const pendingUser: UserProfile = {
            id: `usr_${Date.now()}`,
            name: userData.name || i18n.t('state:adminFiscalDefault'),
            email,
            phone: userData.phone || '+258 84 000 0000',
            role: (userData.role as UserProfile['role']) || 'ACCOUNTING_ADMIN',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            companyName: userData.companyName || i18n.t('state:companyNewFallback'),
            companyNuit: userData.companyNuit || '400000000',
            companyAddress: (userData as any).companyAddress || i18n.t('state:country'),
            companyCity: userData.companyCity || i18n.t('state:cityMaputo'),
            companyProvince: userData.companyProvince || i18n.t('state:cityMaputoCidade'),
            plan: (userData.plan as any) || 'PME',
            planStatus: 'active',
            renewalDate: '31/12/2026'
          };
          localStorage.setItem('claq_pending_user', JSON.stringify(pendingUser));
          return 'confirmation-required';
        }
        if (signUpResult.nextStep?.signUpStep === 'DONE') {
          // Auto-confirmed — sign in immediately
          if (signInAfterRegister) return (await login(email, password)) === true;
          addToast('success', i18n.t('state:accountCreatedTitle'), i18n.t('state:accountCreatedMsg', { companyName: userData.companyName || i18n.t('state:companyNewFallback') }));
          return true;
        }
      }
    } catch (e: any) {
      const name = e?.name || '';
      if (name.includes('UsernameExistsException')) {
        addToast('error', i18n.t('state:emailExistsTitle'), i18n.t('state:emailExistsMsg'));
      } else {
        console.error('Cognito signUp failed:', e);
        addToast('error', i18n.t('state:registerErrorTitle'), e?.message || i18n.t('state:registerErrorMsg'));
      }
      return false;
    }

    return false;
  };

  const confirmRegistration = async (emailInput: string, code: string) => {
    try {
      await cognitoConfirmSignUp({ username: emailInput.trim().toLowerCase(), confirmationCode: code.trim() });
      addToast('success', i18n.t('state:emailVerifiedTitle'), i18n.t('state:emailVerifiedMsg'));
      return true;
    } catch (e: any) {
      console.error('Cognito email confirmation failed:', e);
      addToast('error', i18n.t('state:confirmEmailTitle'), e?.message || i18n.t('state:confirmEmailErrorMsg'));
      return false;
    }
  };

  const resendRegistrationCode = async (emailInput: string) => {
    try {
      await resendSignUpCode({ username: emailInput.trim().toLowerCase() });
      addToast('info', i18n.t('state:confirmEmailTitle'), i18n.t('state:confirmationCodeResentMsg'));
      return true;
    } catch (e: any) {
      console.error('Cognito confirmation code resend failed:', e);
      addToast('error', i18n.t('state:confirmEmailTitle'), e?.message || i18n.t('state:confirmEmailErrorMsg'));
      return false;
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
    setTenants([]);
    setActiveTenantIdState(null);
    localStorage.removeItem('claq_user');
    localStorage.removeItem('claq_is_auth');
    localStorage.removeItem('claq_cognito_idToken');
    localStorage.removeItem('claq_token');
    localStorage.removeItem('claq_pending_user');
    localStorage.removeItem('claq_obligations');
    localStorage.removeItem('claq_clients');
    localStorage.removeItem('claq_simulations');
    localStorage.removeItem('claq_tenants');
    localStorage.removeItem('claq_active_tenant');
    addToast('info', i18n.t('state:sessionEndedTitle'), i18n.t('state:sessionEndedMsg'));
  };

  const setActiveTenantId = (id: string | null) => {
    setActiveTenantIdState(id);
    if (id) {
      localStorage.setItem('claq_active_tenant', id);
    } else {
      localStorage.removeItem('claq_active_tenant');
    }
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
    addToast('success', i18n.t('state:profileUpdatedTitle'), i18n.t('state:profileUpdatedMsg'));
  };

  // Obligations Actions
  const markObligationPaid = (id: string) => {
    ApiClient.patch(`/obligations/${id}/settle`).catch(() => {
      addToast('error', i18n.t('state:settleNotConfirmedTitle'), i18n.t('state:settleNotConfirmedMsg'));
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
    addToast('success', i18n.t('state:obligationSettledTitle'), i18n.t('state:obligationSettledMsg'));
  };

  const addObligation = (obl: Omit<FiscalObligation, 'id'>) => {
    const newObl: FiscalObligation = {
      ...obl,
      companyId: obl.companyId ?? activeClient?.id ?? null,
      id: `obl_${Date.now()}`
    };
    ApiClient.post('/obligations', newObl).catch(() => addToast('error', i18n.t('state:obligationNotSavedTitle'), i18n.t('state:settleNotConfirmedMsg')));
    setObligations(prev => {
      const updated = [newObl, ...prev];
      localStorage.setItem('claq_obligations', JSON.stringify(updated));
      return updated;
    });
    addToast('success', i18n.t('state:obligationAddedTitle'), i18n.t('state:obligationAddedMsg', { title: newObl.title, dueDate: newObl.dueDate }));
  };

  const deleteObligation = (id: string) => {
    ApiClient.delete(`/obligations/${id}`).catch(() => addToast('error', i18n.t('state:obligationDeletedTitle'), i18n.t('state:settleNotConfirmedMsg')));
    setObligations(prev => {
      const updated = prev.filter(o => o.id !== id);
      localStorage.setItem('claq_obligations', JSON.stringify(updated));
      return updated;
    });
    addToast('info', i18n.t('state:obligationRemovedTitle'), i18n.t('state:obligationRemovedMsg'));
  };

  const loadStandardMozambiqueTemplate = async () => {
    try {
      const res = await ApiClient.post<{ success: boolean; data: FiscalObligation[] }>('/obligations/template/mozambique', {});
      if (res && res.data) {
        setObligations(res.data);
        localStorage.setItem('claq_obligations', JSON.stringify(res.data));
        addToast('success', i18n.t('state:templateLoadedTitle'), i18n.t('state:templateLoadedMsg', { count: res.data.length }));
        return;
      }
    } catch (e) {
      // Local computation
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const monthLabel = CalendarEngine.getMonthName(month, year, i18n.language);
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const monthStr = String(month + 1).padStart(2, '0');

      const template: FiscalObligation[] = [
        {
          id: `obl-iva-${year}-${monthStr}`,
          title: i18n.t('data:templateIvaTitle'),
          category: 'IVA',
          period: monthLabel,
          dueDate: `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`,
          status: 'a_vencer',
          amount: 125000,
          authority: 'AT',
          description: i18n.t('data:templateIvaDesc'),
          penaltyRisk: i18n.t('data:templateIvaPenalty'),
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`)
        },
        {
          id: `obl-inss-${year}-${monthStr}`,
          title: i18n.t('data:templateInssTitle'),
          category: 'INSS',
          period: monthLabel,
          dueDate: `${year}-${monthStr}-10`,
          status: 'a_vencer',
          amount: 45000,
          authority: 'INSS',
          description: i18n.t('data:templateInssDesc'),
          penaltyRisk: i18n.t('data:templateInssPenalty'),
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-10`)
        },
        {
          id: `obl-irps-${year}-${monthStr}`,
          title: i18n.t('data:templateIrpsTitle'),
          category: 'IRPS',
          period: monthLabel,
          dueDate: `${year}-${monthStr}-20`,
          status: 'a_vencer',
          amount: 68000,
          authority: 'AT',
          description: i18n.t('data:templateIrpsDesc'),
          penaltyRisk: i18n.t('data:templateIrpsPenalty'),
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-20`)
        },
        {
          id: `obl-tae-${year}`,
          title: i18n.t('data:templateTaeTitle'),
          category: 'TAE',
          period: i18n.t('data:templateTaePeriod', { year }),
          dueDate: `${year}-${monthStr}-25`,
          status: 'a_vencer',
          amount: 12000,
          authority: 'Municipio',
          description: i18n.t('data:templateTaeDesc'),
          penaltyRisk: i18n.t('data:templateTaePenalty'),
          daysRemaining: CalendarEngine.getDaysRemaining(`${year}-${monthStr}-25`)
        }
      ];

      setObligations(template);
      localStorage.setItem('claq_obligations', JSON.stringify(template));
      addToast('success', i18n.t('state:templateLoadedTitle'), i18n.t('state:templateLoadedMsg', { count: template.length }));
    }
  };

  const clearAllUserData = () => {
    setObligations([]);
    setClients([]);
    setSimulations([]);
    localStorage.removeItem('claq_obligations');
    localStorage.removeItem('claq_clients');
    localStorage.removeItem('claq_simulations');
    addToast('info', i18n.t('state:dataClearedTitle'), i18n.t('state:dataClearedMsg'));
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

  const markAllAlertsAsRead = (companyId?: string | null) => {
    const affectedAlerts = companyId === undefined
      ? alerts
      : alerts.filter(alert => (alert.companyId ?? null) === companyId);
    if (companyId === undefined) ApiClient.patch('/alerts/mark-read').catch(() => {});
    else affectedAlerts.forEach(alert => ApiClient.patch(`/alerts/${alert.id}/read`).catch(() => {}));
    const affectedIds = affectedAlerts.map(alert => alert.id);
    setReadAlertIds(prev => {
      const updated = Array.from(new Set([...prev, ...affectedIds]));
      localStorage.setItem('claq_read_alerts', JSON.stringify(updated));
      return updated;
    });
    addToast('info', i18n.t('state:alertsReadTitle'), i18n.t('state:alertsReadMsg'));
  };

  const dispatchTestAlert = (channel: 'whatsapp' | 'email' | 'sms' | 'system') => {
    ApiClient.post('/alerts/test-dispatch', { channel }).catch(() => {});
    const channelNames = {
      whatsapp: i18n.t('state:channelWhatsapp'),
      email: i18n.t('state:channelEmail'),
      sms: i18n.t('state:channelSms'),
      system: i18n.t('state:channelPanel')
    };
    addToast('success', i18n.t('state:testAlertTitle'), i18n.t('state:testAlertMsg', { channel: channelNames[channel] }));
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
    addToast('success', i18n.t('state:simSavedTitle'), i18n.t('state:simSavedMsg'));
    return newRecord;
  };

  const deleteSimulation = (id: string) => {
    ApiClient.delete(`/simulations/${id}`).catch(() => {});
    setSimulations(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('claq_simulations', JSON.stringify(updated));
      return updated;
    });
    addToast('info', i18n.t('state:simDeletedTitle'), i18n.t('state:simDeletedMsg'));
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
    addToast('success', i18n.t('state:clientAddedTitle'), i18n.t('state:clientAddedMsg', { name: newClient.name }));
  };

  const deleteClient = (id: string) => {
    ApiClient.delete(`/clients/${id}`).catch(() => {});
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('claq_clients', JSON.stringify(updated));
      return updated;
    });
    if (activeClient?.id === id) setActiveClient(null);
    addToast('info', i18n.t('state:clientRemovedTitle'), i18n.t('state:clientRemovedMsg'));
  };

  // Settings Actions
  const updateSettings = (data: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('claq_settings', JSON.stringify(updated));
      return updated;
    });
    addToast('success', i18n.t('state:settingsSavedTitle'), i18n.t('state:settingsSavedMsg'));
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
    addToast('success', i18n.t('state:whatsappConnectedTitle'), i18n.t('state:whatsappConnectedMsg', { phone }));
  };

  const openAIAssistantWithPrompt = (prompt: string) => {
    setAiAssistantPrompt(prompt);
    setIsAIAssistantOpen(true);
  };

  const openPDFPreview = (report: SimulationReport) => {
    setPdfSimulationData(report);
    setIsPDFModalOpen(true);
  };

  return (
    <AppStateContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        registerUser,
        confirmRegistration,
        resendRegistrationCode,
        logout,
        updateUser,
        tenants,
        activeTenantId,
        setActiveTenantId,
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
        language,
        setLanguage,
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
