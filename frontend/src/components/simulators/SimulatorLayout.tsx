import React from 'react';
import { ArrowLeft, Printer, Save } from 'lucide-react';

export interface SimulatorLayoutProps {
  onNavigate: (path: string) => void;
  categoria: string;
  nome: string;
  currentStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  onPrint?: () => void;
  onSave?: () => void;
  children: React.ReactNode;
}

export const SimulatorLayout: React.FC<SimulatorLayoutProps> = ({
  onNavigate,
  categoria,
  nome,
  currentStep,
  onStepChange,
  onPrint,
  onSave,
  children,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb & Navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate('/simuladores')}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--blue-600)', fontWeight: 600 }}
          >
            <ArrowLeft size={16} />
            <span>Voltar para Simuladores</span>
          </button>
          <div style={{ fontSize: '13px', color: 'var(--slate-400)' }}>
            Simuladores &gt;{' '}
            <span style={{ color: 'var(--slate-600)' }}>{categoria}</span> &gt;{' '}
            <span style={{ color: 'var(--slate-900)', fontWeight: 600 }}>
              {nome}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onPrint && (
            <button
              onClick={onPrint}
              className="btn btn-secondary btn-sm"
            >
              <Printer size={15} />
              <span>Imprimir / PDF</span>
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              className="btn btn-secondary btn-sm"
            >
              <Save size={15} />
              <span>Guardar</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Bar */}
      <div
        className="card"
        style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {(['Dados', 'Resultados', 'Resumo'] as const).map((label, idx) => {
            const step = (idx + 1) as 1 | 2 | 3;
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;
            return (
              <React.Fragment key={step}>
                {idx > 0 && (
                  <div
                    style={{
                      width: '60px',
                      height: '2px',
                      backgroundColor:
                        currentStep >= step
                          ? 'var(--blue-600)'
                          : 'var(--slate-200)',
                    }}
                  />
                )}
                <div
                  onClick={() => onStepChange(step)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isActive
                        ? 'var(--blue-600)'
                        : isCompleted
                          ? 'var(--emerald-500)'
                          : 'var(--slate-200)',
                      color: isActive || isCompleted ? '#FFFFFF' : 'var(--slate-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    {isCompleted ? '✓' : step}
                  </div>
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--blue-600)' : 'var(--slate-700)',
                    }}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
};
