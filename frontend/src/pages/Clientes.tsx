import React, { useState } from 'react';
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
import { Client } from '../types';

interface ClientesProps {
  onNavigate: (path: string) => void;
}

export const Clientes: React.FC<ClientesProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { clients, addClient, deleteClient, setActiveClient, addToast } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClient({
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
    });
    setIsAddModalOpen(false);
    setName('');
    setNuit('');
    setEmail('');
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
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary-blue"
          style={{ fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>{t('clientes:addClient')}</span>
        </button>
      </div>

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
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary-gold"
              style={{ fontSize: '13px', padding: '9px 18px' }}
            >
              <Plus size={15} />
              <span>+ {t('clientes:registerFirstClient')}</span>
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
                            setActiveClient(cli);
                            onNavigate('/dashboard');
                            addToast('info', t('clientes:toastClientSelected'), t('clientes:toastViewingDashboard', { name: cli.name }));
                          }}
                          className="btn btn-ghost btn-sm"
                          title={t('clientes:viewClientDashboard')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteClient(cli.id)}
                          className="btn btn-ghost btn-sm"
                          title={t('clientes:deleteClient')}
                          style={{ color: 'var(--red-500)' }}
                        >
                          <Trash2 size={16} />
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
