import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Info,
  CheckCircle2,
  Settings,
  ChevronRight,
  Calculator,
  Calendar,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { AlertItem } from '../types';

interface AlertasProps {
  onNavigate: (path: string) => void;
}

export const Alertas: React.FC<AlertasProps> = ({ onNavigate }) => {
  const { alerts, markAllAlertsAsRead, markAlertAsRead, setIsWhatsAppModalOpen } = useAppState();

  const [activeFilter, setActiveFilter] = useState<'todos' | 'pendentes' | 'vencidos' | 'informativos' | 'pagos'>('todos');

  const filteredAlerts = alerts.filter(alt => {
    if (activeFilter === 'pendentes') return alt.severity === 'critical' || alt.severity === 'warning';
    if (activeFilter === 'vencidos') return alt.daysRemaining < 0;
    if (activeFilter === 'informativos') return alt.severity === 'info';
    if (activeFilter === 'pagos') return alt.read;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Alertas
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Receba notificações e mantenha a sua empresa sempre em conformidade fiscal.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={markAllAlertsAsRead} className="btn btn-secondary btn-sm">
            <CheckCircle2 size={15} />
            <span>Marcar todas como lidas</span>
          </button>
          <button onClick={() => onNavigate('/configuracoes')} className="btn btn-secondary btn-sm">
            <Settings size={15} />
            <span>Configurar Alertas</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '8px 16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'pendentes', label: 'Pendentes' },
          { id: 'vencidos', label: 'Vencidos' },
          { id: 'informativos', label: 'Informativos' },
          { id: 'pagos', label: 'Lidos / Concluídos' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeFilter === f.id ? 'var(--blue-600)' : 'transparent',
              color: activeFilter === f.id ? '#FFFFFF' : 'var(--slate-600)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredAlerts.map(alt => {
          const isCritical = alt.severity === 'critical';
          const isWarning = alt.severity === 'warning';
          const isInfo = alt.severity === 'info';

          const bgColor = isCritical ? 'var(--red-50)' : isWarning ? 'var(--gold-50)' : 'var(--blue-50)';
          const borderColor = isCritical ? 'rgba(239, 68, 68, 0.3)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)';
          const textColor = isCritical ? 'var(--red-600)' : isWarning ? 'var(--gold-700)' : 'var(--blue-600)';

          return (
            <div
              key={alt.id}
              onClick={() => {
                markAlertAsRead(alt.id);
                if (alt.actionUrl) onNavigate(alt.actionUrl);
              }}
              className="card card-hover"
              style={{
                padding: '20px 24px',
                backgroundColor: bgColor,
                borderColor: borderColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ marginTop: '2px' }}>
                  {isCritical ? (
                    <AlertTriangle size={22} color="var(--red-600)" />
                  ) : isWarning ? (
                    <Clock size={22} color="var(--gold-600)" />
                  ) : (
                    <Info size={22} color="var(--blue-600)" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)' }}>
                      {alt.title}
                    </h4>
                    <span className="badge" style={{ backgroundColor: '#FFFFFF', color: textColor, fontSize: '11px', fontWeight: 700 }}>
                      {alt.category}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--slate-700)', marginTop: '4px', lineHeight: 1.4 }}>
                    {alt.message}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: textColor, display: 'block' }}>
                    Vence em {alt.daysRemaining} dias
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
                    Data Limite: {alt.dueDate}
                  </span>
                </div>

                <ChevronRight size={18} color="var(--slate-400)" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Callout Banner */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: 'var(--slate-600)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={18} color="var(--blue-600)" />
          <span>
            <b>Como funcionam os alertas?</b> Enviamos lembretes por e-mail, WhatsApp e no sistema conforme suas configurações.
          </span>
        </div>

        <button
          onClick={() => onNavigate('/configuracoes')}
          style={{
            border: 'none',
            background: 'none',
            color: 'var(--blue-600)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Gerenciar preferências →
        </button>
      </div>
    </div>
  );
};
