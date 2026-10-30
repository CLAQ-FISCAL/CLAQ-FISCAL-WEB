import React, { useId } from 'react';

interface ClaqLogoMarkProps {
  size?: number;
  style?: React.CSSProperties;
}

export const ClaqLogoMark: React.FC<ClaqLogoMarkProps> = ({ size = 36, style }) => {
  const gradientId = useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block', ...style }}
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="22" fill={`url(#${gradientId})`} />
      <path
        d="M13 29V22M22 29V15M31 29V18"
        stroke="#0F172A"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 18L19 13L26 17L32 11"
        stroke="#0F172A"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
};

interface ClaqLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const ClaqLogo: React.FC<ClaqLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubtitle = true
}) => {
  const isDarkBg = variant === 'dark'; // dark sidebar / dark login background

  const sizeStyles = {
    sm: { icon: 28, titleSize: '16px', subtitleSize: '8px', gap: '8px' },
    md: { icon: 36, titleSize: '20px', subtitleSize: '9px', gap: '10px' },
    lg: { icon: 46, titleSize: '26px', subtitleSize: '11px', gap: '12px' }
  }[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: sizeStyles.gap, userSelect: 'none' }}>
      <ClaqLogoMark size={sizeStyles.icon} />

      {/* Typography */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: sizeStyles.titleSize,
            letterSpacing: '0.04em',
            color: isDarkBg ? '#FFFFFF' : '#0F172A',
            transition: 'color 0.2s ease'
          }}
        >
          CLAQ
        </span>
        {showSubtitle && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: sizeStyles.subtitleSize,
              letterSpacing: '0.14em',
              color: '#F59E0B',
              marginTop: '2px'
            }}
          >
            FISCAL ALERT
          </span>
        )}
      </div>
    </div>
  );
};
