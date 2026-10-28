import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit,
  MessageSquare,
  Building,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useTranslation } from 'react-i18next';
import { Client, FiscalObligation } from '../types';
import { useCompanies } from '../hooks/useUploads';
import { usePlans, useSubscription } from '../hooks/useFiscalQueries';
import { ApiClient } from '../api/client';
import { readIntentPlan, readPendingDemoPlanFor } from '../lib/audience';
import { formatDate } from '../utils/formatters';

interface ClientesProps {
  onNavigate: (path: string) => void;
}

export const Clientes: React.FC<ClientesProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { clients: localClients, obligations, addClient, deleteClient, activeClient, setActiveClient, addToast, isAuthenticated, activeTenantId, setActiveTenantId, user } = useAppState();
  const queryClient = useQueryClient();
  const companiesQuery = useCompanies(isAuthenticated);
  const subscriptionQuery = useSubscription(isAuthenticated, activeTenantId);
  const plansQuery = usePlans();
  const intendedPlanCode = readIntentPlan();
  const pendingPlanForUser = isAuthenticated ? readPendingDemoPlanFor(user?.email) : null;
  const defaultDemoPlanCode = pendingPlanForUser?.planCode
    ?? (intendedPlanCode?.startsWith('ACCOUNTANT_') ? intendedPlanCode : 'ACCOUNTANT_FREE');
  const [demoPlanChoice, setDemoPlanChoice] = useState(defaultDemoPlanCode);
  const [activatingDemoPlan, setActivatingDemoPlan] = useState(false);
  const [demoPlanActivationError, setDemoPlanActivationError] = useState('');
  const selectedPlanCode = isAuthenticated ? pendingPlanForUser?.planCode : intendedPlanCode;
  const selectedAccountantPlan = selectedPlanCode?.startsWith('ACCOUNTANT_')
    ? plansQuery.data?.families.ACCOUNTANT.find(item => item.code === selectedPlanCode)
    : undefined;
  // The subscription API is authoritative after sign-in. For a local/demo
  // session, use the accountant plan chosen during onboarding so its cap still
  // applies even when the billing backend is not connected.
  const localAccountantLimit = selectedAccountantPlan?.limits.maxCompanies
    ?? (selectedPlanCode === 'ACCOUNTANT_FREE' ? 3 : selectedPlanCode === 'ACCOUNTANT_PRO' ? 20 : selectedPlanCode === 'ACCOUNTANT_PREMIUM' ? 999999 : null);
  const backendLimit = subscriptionQuery.data?.limits.maxCompanies ?? null;
  const effectiveLimit = isAuthenticated ? backendLimit : localAccountantLimit;
  const unlimited = effectiveLimit !== null && effectiveLimit >= 999999;
  const getNextObligation = (clientId: string) => obligations
    .map((obligation) => {
      const record = obligation as FiscalObligation & { dueAt?: string };
      const dueDate = record.dueDate || record.dueAt?.slice(0, 10) || '';
      return { ...record, dueDate };
    })
    .filter(obligation => obligation.companyId === clientId
      && !!obligation.dueDate
      && !['pago', 'paid', 'submitted', 'not_applicable'].includes(String(obligation.status).toLowerCase()))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const backendClients: Client[] = (companiesQuery.data ?? []).map((company) => ({
    id: company.id,
    name: company.legalName,
    nuit: company.hasNuit ? '•••••••••' : '—',
    plan: 'PME',
    status: 'regular',
    nextObligation: '—',
    nextObligationDate: '',
    contactEmail: '',
    contactPhone: '',
    activitySector: company.taxRegime || t('clientes:defaultSector'),
    city: company.municipality || '—',
  }));
  const clients = (isAuthenticated ? backendClients : localClients).map(client => {
    const next = getNextObligation(client.id);
    if (!next) return { ...client, nextObligation: t('clientes:noUpcomingObligation'), nextObligationDate: '' };
    return {
      ...client,
      nextObligation: `${next.title} – ${formatDate(next.dueDate)}`,
      nextObligationDate: next.dueDate,
    };
  });
  const canAddClient = isAuthenticated
    ? subscriptionQuery.isSuccess && (unlimited || (effectiveLimit !== null && (subscriptionQuery.data?.usage.companies ?? 0) < effectiveLimit))
    : effectiveLimit === null || unlimited || localClients.length < effectiveLimit;
  const attemptedDemoProvision = useRef(false);
  // Local Vite preview is wired to the demo API in vite.config.ts. Older demo
  // API deployments may not yet include the public demoMode flag.
  const isDemoMode = plansQuery.data?.demoMode === true || import.meta.env.DEV;
  const subscriptionError = subscriptionQuery.error instanceof Error ? subscriptionQuery.error.message : '';
  const missingDemoTenant = isAuthenticated
    && isDemoMode
    && subscriptionQuery.isError
    && subscriptionError.includes('NO_TENANT');

  const activateChosenDemoPlan = async () => {
    const chosenPlan = plansQuery.data?.families.ACCOUNTANT.find(item => item.code === demoPlanChoice);
    if (!chosenPlan || !user?.email || activatingDemoPlan) return;
    setActivatingDemoPlan(true);
    setDemoPlanActivationError('');
    localStorage.setItem('claq_pending_demo_plan', JSON.stringify({
      email: user.email.trim().toLowerCase(),
      planCode: chosenPlan.code,
      tenantName: user.companyName,
    }));
    try {
      const result = await ApiClient.activateDemoPlan({ planCode: chosenPlan.code, tenantName: user.companyName });
      localStorage.removeItem('claq_pending_demo_plan');
      setActiveTenantId(result.tenantId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['companies'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
      ]);
    } catch (error) {
      console.error('Demo accountant tenant activation failed:', error);
      setDemoPlanActivationError(t('clientes:demoActivationFailed'));
    } finally {
      setActivatingDemoPlan(false);
    }
  };

  useEffect(() => {
    const needsDemoTenant = isAuthenticated
      && isDemoMode
      && !!selectedAccountantPlan
      && subscriptionQuery.isError
      && subscriptionError.includes('NO_TENANT');

    if (!needsDemoTenant || attemptedDemoProvision.current) return;
    attemptedDemoProvision.current = true;
    void ApiClient.activateDemoPlan({
      planCode: selectedAccountantPlan.code,
      tenantName: pendingPlanForUser?.tenantName || user?.companyName,
    }).then((result) => {
      localStorage.removeItem('claq_pending_demo_plan');
      setActiveTenantId(result.tenantId);
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }).catch((error) => {
      console.error('Demo accountant tenant provisioning failed:', error);
    });
  }, [
    isAuthenticated,
    isDemoMode,
    selectedAccountantPlan?.code,
    pendingPlanForUser?.tenantName,
    subscriptionQuery.error,
    subscriptionQuery.isError,
    user?.companyName,
    setActiveTenantId,
    queryClient,
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clientPendingDeletion, setClientPendingDeletion] = useState<Client | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // New Client Form
  const [name, setName] = useState('');
  const [nuit, setNuit] = useState('');
  const [plan, setPlan] = useState<'PME' | 'Contabilidade' | 'Enterprise'>('PME');
  const [status, setStatus] = useState<'regular' | 'alerta' | 'critico'>('regular');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+258 84 ');
  const [sector, setSector] = useState(t('clientes:defaultSector'));
  const [city, setCity] = useState('Maputo');

  const filteredClients = clients.filter(cli => {
    if (statusFilter !== 'all' && cli.status !== statusFilter) return false;
    if (planFilter !== 'all' && cli.plan !== planFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return cli.name.toLowerCase().includes(q) || cli.nuit.includes(q) || cli.city.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newClient = {
      name,
      nuit,
      plan,
      status,
      nextObligation: 'IVA – 30/06/2026',
      nextObligationDate: '2026-06-30',
      contactEmail: email,
      contactPhone: phone,
      activitySector: sector,
      city
    };
    if (isAuthenticated) {
      if (!subscriptionQuery.isSuccess || !canAddClient) {
        addToast('warning', t('clientes:limitReachedTitle'), t('clientes:limitReachedMessage', {
          limit: backendLimit === null || unlimited ? '—' : backendLimit,
        }));
        return;
      }
      try {
        await ApiClient.createCompany({ legalName: name, nuit, municipality: city, taxRegime: sector });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['companies'] }),
          queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        ]);
        addToast('success', t('state:clientAddedTitle'), t('state:clientAddedMsg', { name }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isLimitError = message.includes('PLAN_LIMIT_EXCEEDED');
        addToast('error', isLimitError ? t('clientes:limitReachedTitle') : t('clientes:addFailedTitle'),
          isLimitError ? t('clientes:limitReachedMessage', { limit: backendLimit }) : t('clientes:addFailedMessage'));
        return;
      }
    } else {
      if (!canAddClient) {
        addToast('warning', t('clientes:limitReachedTitle'), t('clientes:limitReachedMessage', {
          limit: effectiveLimit === null || unlimited ? '—' : effectiveLimit,
        }));
        return;
      }
      addClient(newClient);
    }
    setIsAddModalOpen(false);
    setName('');
    setNuit('');
    setEmail('');
  };

  const handleDeleteClient = async () => {
    if (!clientPendingDeletion || deleteConfirmation.trim().toLowerCase() !== 'confirm' || isDeletingClient) return;
    setIsDeletingClient(true);
    try {
      if (isAuthenticated) {
        await ApiClient.delete(`/companies/${clientPendingDeletion.id}`);
        if (clientPendingDeletion.id === activeClient?.id) setActiveClient(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['companies'] }),
          queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        ]);
      } else {
        deleteClient(clientPendingDeletion.id);
      }
      addToast('success', t('clientes:deleteSuccessTitle'), t('clientes:deleteSuccessMessage', { name: clientPendingDeletion.name }));
      setClientPendingDeletion(null);
      setDeleteConfirmation('');
    } catch (error) {
      console.error('Client deletion failed:', error);
      addToast('error', t('clientes:deleteFailedTitle'), t('clientes:deleteFailedMessage'));
    } finally {
      setIsDeletingClient(false);
    }
  };

  const addButtonDisabled = !canAddClient;
  const openAddModal = () => {
    if (addButtonDisabled) {
      addToast('warning', t('clientes:limitReachedTitle'), t('clientes:limitReachedMessage', { limit: unlimited ? '—' : effectiveLimit }));
      return;
    }
    setIsAddModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            {t('clientes:pageTitle')}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
            {t('clientes:pageSubtitle')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn btn-primary-blue"
          style={{ fontSize: '13px' }}
          disabled={addButtonDisabled}
        >
          <Plus size={16} />
          <span>{t('clientes:addClient')}</span>
        </button>
      </div>

      {((isAuthenticated && subscriptionQuery.isSuccess) || (!isAuthenticated && effectiveLimit !== null)) && (
        <div className="card" style={{ padding: '12px 18px', fontSize: '13px', color: 'var(--slate-600)' }}>
          {t('clientes:planUsage', {
            count: isAuthenticated ? subscriptionQuery.data!.usage.companies : localClients.length,
            limit: unlimited ? t('clientes:unlimited') : effectiveLimit,
          })}
        </div>
      )}
      {isAuthenticated && (subscriptionQuery.isLoading || companiesQuery.isLoading) && (
        <div role="status" style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{t('clientes:loadingClients')}</div>
      )}
      {isAuthenticated && (subscriptionQuery.isError || companiesQuery.isError) && (
        <div className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', color: 'var(--red-600)' }}>
          <span>{t('clientes:loadFailedMessage')}</span>
          <button className="btn btn-secondary" onClick={() => { attemptedDemoProvision.current = false; void subscriptionQuery.refetch(); void companiesQuery.refetch(); }}>
            {t('common:retry')}
          </button>
        </div>
      )}
      {missingDemoTenant && (
        <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong>{t('clientes:demoActivationTitle')}</strong>
            <p style={{ marginTop: '4px', color: 'var(--slate-600)', fontSize: '13px' }}>{t('clientes:demoActivationDescription')}</p>
          </div>
          {plansQuery.data?.families.ACCOUNTANT && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <select className="form-control" style={{ width: 'min(100%, 340px)' }} value={demoPlanChoice} onChange={event => setDemoPlanChoice(event.target.value)}>
                {plansQuery.data.families.ACCOUNTANT.map(item => (
                  <option key={item.code} value={item.code}>{item.label} · {item.limits.maxCompanies >= 999999 ? t('clientes:unlimited') : item.limits.maxCompanies} {t('clientes:clientsUnit')}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => void activateChosenDemoPlan()} disabled={activatingDemoPlan}>
                {activatingDemoPlan ? t('clientes:demoActivating') : t('clientes:demoActivateButton')}
              </button>
            </div>
          )}
          {demoPlanActivationError && <p role="alert" style={{ color: 'var(--red-600)' }}>{demoPlanActivationError}</p>}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '36px', fontSize: '13px' }}
            placeholder={t('clientes:searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-control"
            style={{ width: '160px', padding: '7px 12px', fontSize: '13px' }}
          >
            <option value="all">{t('clientes:allStatuses')}</option>
            <option value="regular">{t('common:statusRegular')}</option>
            <option value="alerta">{t('common:statusAlert')}</option>
            <option value="critico">{t('common:statusCritical')}</option>
          </select>

          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="form-control"
            style={{ width: '160px', padding: '7px 12px', fontSize: '13px' }}
          >
            <option value="all">{t('clientes:allPlans')}</option>
            <option value="PME">{t('clientes:planPME')}</option>
            <option value="Contabilidade">{t('clientes:planContabilidade')}</option>
            <option value="Enterprise">{t('clientes:planEnterprise')}</option>
          </select>
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filteredClients.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Users size={40} color="var(--slate-300)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-800)' }}>
              {t('clientes:noClients')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 16px' }}>
              {t('clientes:noClientsDesc')}
            </p>
            <button
              onClick={openAddModal}
              className="btn btn-primary-gold"
              style={{ fontSize: '13px', padding: '9px 18px' }}
              disabled={addButtonDisabled}
            >
              <Plus size={15} />
              <span>{t('clientes:registerFirstClient')}</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('clientes:colClient')}</th>
                  <th>NUIT</th>
                  <th>{t('clientes:colPlan')}</th>
                  <th>{t('common:status')}</th>
                  <th>{t('clientes:colNextObligation')}</th>
                  <th style={{ textAlign: 'right' }}>{t('common:actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(cli => (
                  <tr key={cli.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)', display: 'block' }}>{cli.name}</span>
                        <span style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>{cli.city} • {cli.activitySector}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--slate-700)' }}>{cli.nuit}</td>
                    <td>
                      <span className="badge badge-slate" style={{ fontSize: '11px' }}>
                        {t(`clientes:plan${cli.plan}`)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          cli.status === 'regular' ? 'badge-green' : cli.status === 'alerta' ? 'badge-amber' : 'badge-red'
                        }`}
                      >
                        {cli.status === 'regular' ? t('common:statusRegular') : cli.status === 'alerta' ? t('common:statusAlert') : t('common:statusCritical')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                      {cli.nextObligation}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setClientPendingDeletion(cli);
                            setDeleteConfirmation('');
                          }}
                          className="btn btn-ghost btn-sm"
                          title={t('clientes:deleteClient')}
                          aria-label={t('clientes:deleteClient')}
                          style={{ color: 'var(--red-500)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setActiveClient(cli);
                            onNavigate('/dashboard');
                            addToast('info', t('clientes:toastClientSelected'), t('clientes:toastViewingDashboard', { name: cli.name }));
                          }}
                          className="btn btn-ghost btn-sm"
                          title={t('clientes:viewClientDashboard')}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer pagination info */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: 'var(--slate-500)' }}>
          <span>{t('clientes:showingXofX', { start: 1, end: filteredClients.length, total: filteredClients.length })}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--blue-600)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
              1
            </span>
          </div>
        </div>
      </div>

      {clientPendingDeletion && (
        <div className="modal-overlay" onClick={() => !isDeletingClient && setClientPendingDeletion(null)}>
          <div className="modal-card" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--red-600)' }}>{t('clientes:confirmDeleteTitle')}</h3>
              <button onClick={() => setClientPendingDeletion(null)} className="btn btn-ghost" style={{ padding: '6px' }} disabled={isDeletingClient}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '14px' }}>
                {t('clientes:confirmDeleteMessage', { name: clientPendingDeletion.name })}
              </p>
              <p style={{ color: 'var(--red-600)', fontSize: '12.5px' }}>{t('clientes:confirmDeleteWarning')}</p>
              <label className="form-group">
                <span className="form-label">{t('clientes:typeConfirmLabel')}</span>
                <input
                  autoFocus
                  type="text"
                  className="form-control"
                  value={deleteConfirmation}
                  onChange={event => setDeleteConfirmation(event.target.value)}
                  placeholder="confirm"
                  autoComplete="off"
                />
              </label>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'var(--slate-50)' }}>
              <button type="button" onClick={() => setClientPendingDeletion(null)} className="btn btn-secondary" disabled={isDeletingClient}>{t('common:cancel')}</button>
              <button
                type="button"
                onClick={() => void handleDeleteClient()}
                className="btn btn-secondary"
                style={{ borderColor: 'var(--red-500)', color: 'var(--red-600)' }}
                disabled={deleteConfirmation.trim().toLowerCase() !== 'confirm' || isDeletingClient}
              >
                <Trash2 size={16} />
                {isDeletingClient ? t('clientes:deletingClient') : t('clientes:confirmDeleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                {t('clientes:addNewClient')}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-ghost" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">{t('clientes:formCompanyName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('clientes:namePlaceholder')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('clientes:formNuit')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="400123456"
                      value={nuit}
                      onChange={e => setNuit(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('clientes:colPlan')}</label>
                    <select
                      className="form-control"
                      value={plan}
                      onChange={e => setPlan(e.target.value as any)}
                    >
                      <option value="PME">{t('clientes:planPME')}</option>
                      <option value="Contabilidade">{t('clientes:planContabilidade')}</option>
                      <option value="Enterprise">{t('clientes:planEnterprise')}</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('clientes:formEmail')}</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="finance@empresa.co.mz"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('clientes:formPhone')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+258 84 000 0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('clientes:formSector')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('clientes:sectorPlaceholder')}
                      value={sector}
                      onChange={e => setSector(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('clientes:formCity')}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Maputo, Beira, Nampula"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'var(--slate-50)' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  {t('common:cancel')}
                </button>
                <button type="submit" className="btn btn-primary-blue">
                  {t('clientes:saveClient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
