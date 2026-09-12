import React from 'react';
import { Languages } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { AppLanguage } from './index';

interface LanguageToggleProps {
  variant?: 'light' | 'dark';
}

const OPTIONS: { code: AppLanguage; label: string }[] = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' }
];

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'light'
}) => {
  const { language, setLanguage } = useAppState();

  const isDark = variant === 'dark';

  return (
    <div
      role="group"
      aria-label="Language"
      title={isDark ? undefined : 'Idioma / Language'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '3px',
        borderRadius: '9px',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--slate-100)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid var(--slate-200)',
        flexShrink: 0
      }}
    >
      <Languages size={14} color={isDark ? '#94A3B8' : 'var(--slate-400)'} style={{ margin: '0 4px 0 2px' }} />
      {OPTIONS.map(opt => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            type="button"
            style={{
              border: 'none',
              padding: '5px 10px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.03em',
              cursor: 'pointer',
              backgroundColor: isActive
                ? isDark
                  ? '#F59E0B'
                  : '#0F172A'
                : 'transparent',
              color: isActive
                ? isDark
                  ? '#78350F'
                  : '#FFFFFF'
                : isDark
                ? '#CBD5E1'
                : 'var(--slate-500)',
              transition: 'all 0.18s ease',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'var(--slate-200)';
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};