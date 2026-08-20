import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Bell,
  Calendar,
  Calculator,
  ShieldCheck,
  Headphones,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ClaqLogo } from '../components/common/ClaqLogo';
import { useAppState } from '../context/AppStateContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAppState();

  const [emailOrNuit, setEmailOrNuit] = useState('carlos.apollo@claq.co.mz');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(emailOrNuit, password);
      setIsLoading(false);
      onLoginSuccess();
    }, 400);
  };

  const handleQuickDemo = (email: string) => {
    setEmailOrNuit(email);
    setPassword('senha123456');
    login(email, 'senha123456');
    onLoginSuccess();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        backgroundColor: '#0B132B',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* LEFT COLUMN: Dark Navy Branding, Value Props & Bridge Silhouette */}
      <div
        style={{
          flex: '1 1 50%',
          padding: '48px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          background: 'radial-gradient(circle at 80% 20%, #15224A 0%, #0B132B 70%)',
          color: '#FFFFFF',
          zIndex: 1
        }}
      >
        {/* Subtle Decorative Golden Orbital Arcs */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.65,
            zIndex: 0
          }}
          viewBox="0 0 700 800"
          fill="none"
        >
          <circle cx="650" cy="350" r="320" stroke="rgba(245, 158, 11, 0.25)" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="650" cy="350" r="240" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
          <circle cx="650" cy="350" r="160" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1" />
          <circle cx="410" cy="350" r="18" fill="#F59E0B" />
          <circle cx="410" cy="350" r="28" stroke="#F59E0B" strokeWidth="1.5" opacity="0.5" />
          <path d="M405 350L409 354L416 346" stroke="#0B132B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Top Logo */}
        <div style={{ zIndex: 2 }}>
          <ClaqLogo variant="dark" size="lg" />
        </div>

        {/* Center Hero & Value Props */}
        <div style={{ maxWidth: '520px', margin: '40px 0', zIndex: 2 }}>
          <h1
            style={{
              fontSize: '38px',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#FFFFFF',
              marginBottom: '16px'
            }}
          >
            Nunca mais perca um{' '}
            <span
              style={{
                color: '#F59E0B',
                position: 'relative',
                display: 'inline-block'
              }}
            >
              prazo fiscal.
            </span>
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              color: '#CBD5E1',
              lineHeight: 1.6,
              marginBottom: '32px'
            }}
          >
            O CLAQ Fiscal Alert ajuda empresas e contabilistas a cumprir todas as suas obrigações fiscais, laborais e municipais com antecedência.
          </p>

          {/* 4 Feature Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Bell size={20} color="#F59E0B" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Alertas personalizados</h4>
                <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>Receba lembretes automáticos antes dos prazos.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Calendar size={20} color="#F59E0B" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Calendário Fiscal</h4>
                <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>Acompanhe todas as obrigações num só lugar.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Calculator size={20} color="#F59E0B" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Simuladores Inteligentes</h4>
                <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>Calcule impostos, contribuições e muito mais.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={20} color="#F59E0B" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Conformidade e Segurança</h4>
                <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>Mantenha a sua empresa sempre em conformidade.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial & Golden Wave Curve */}
        <div style={{ zIndex: 2, position: 'relative' }}>
          {/* Bridge Vector & Wave Graphic */}
          <div
            style={{
              padding: '24px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              backdropFilter: 'blur(8px)',
              maxWidth: '520px'
            }}
          >
            <div style={{ fontSize: '32px', color: '#F59E0B', lineHeight: 1, fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
              “
            </div>
            <p style={{ fontSize: '14.5px', color: '#FFFFFF', fontStyle: 'italic', lineHeight: 1.5 }}>
              Mais organização, menos multas, mais crescimento para o seu negócio.
            </p>
            <p style={{ fontSize: '13px', color: '#FBBF24', fontWeight: 700, marginTop: '8px' }}>
              CLAQ Consultores
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean White Auth Card */}
      <div
        style={{
          flex: '1 1 50%',
          backgroundColor: '#FFFFFF',
          padding: '48px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Lock Icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#0B132B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 16px rgba(11, 19, 43, 0.2)'
            }}
          >
            <Lock size={26} color="#F59E0B" />
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 800, textAlign: 'center', color: 'var(--slate-900)' }}>
            Bem-vindo de volta! 👋
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', textAlign: 'center', marginTop: '6px', marginBottom: '28px' }}>
            Faça login para aceder à sua conta
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email ou NUIT</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--slate-400)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="exemplo@empresa.co.mz"
                  value={emailOrNuit}
                  onChange={e => setEmailOrNuit(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="var(--slate-400)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--slate-400)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '24px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--slate-700)', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--blue-600)', width: '16px', height: '16px' }}
                />
                <span>Lembrar-me</span>
              </label>

              <a
                href="#forgot"
                onClick={e => { e.preventDefault(); alert('Instruções de recuperação enviadas para o seu e-mail.'); }}
                style={{ color: 'var(--blue-600)', fontWeight: 600, textDecoration: 'none' }}
              >
                Esqueceu a senha?
              </a>
            </div>

            {/* Gold Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary-gold"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                borderRadius: '12px',
                marginBottom: '24px'
              }}
            >
              {isLoading ? 'A autenticar...' : 'Entrar na sua conta'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Social Sign-in */}
          <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
            <div style={{ height: '1px', backgroundColor: 'var(--slate-200)', width: '100%' }} />
            <span
              style={{
                position: 'relative',
                top: '-10px',
                backgroundColor: '#FFFFFF',
                padding: '0 12px',
                fontSize: '12px',
                color: 'var(--slate-400)',
                fontWeight: 500
              }}
            >
              ou continuar com
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={() => handleQuickDemo('carlos.apollo@claq.co.mz')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px', fontSize: '12.5px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"/>
                <path fill="#FBBC05" d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
              </svg>
              <span>Google</span>
            </button>

            <button
              onClick={() => handleQuickDemo('carlos.apollo@claq.co.mz')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px', fontSize: '12.5px' }}
            >
              <svg width="16" height="16" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              <span>Microsoft</span>
            </button>

            <button
              onClick={() => handleQuickDemo('carlos.apollo@claq.co.mz')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '9px', fontSize: '12.5px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.9.04-2.02.6-2.66 1.34-.56.65-1.06 1.7-1.02 2.76 1.01.08 2.06-.52 2.67-1.23"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Create Account Link */}
          <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--slate-600)' }}>
            Não tem uma conta?{' '}
            <a
              href="#register"
              onClick={e => { e.preventDefault(); handleQuickDemo('novo.utilizador@empresa.co.mz'); }}
              style={{ color: 'var(--blue-600)', fontWeight: 700, textDecoration: 'none' }}
            >
              Criar conta grátis →
            </a>
          </p>

          {/* Quick Demo Credentials Assistant */}
          <div
            style={{
              marginTop: '28px',
              padding: '12px 14px',
              backgroundColor: '#F8FAFC',
              border: '1px dashed var(--slate-300)',
              borderRadius: '10px',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: 'var(--slate-700)' }}>⚡ Acesso Rápido para Demonstração:</span>
              <span className="badge badge-amber" style={{ fontSize: '10px' }}>1-Clique</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemo('carlos.apollo@claq.co.mz')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', flex: 1 }}
              >
                Carlos Apollo (Admin/Contabilista)
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Security Badges */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            width: '90%',
            maxWidth: '520px',
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--slate-100)',
            paddingTop: '16px',
            fontSize: '11.5px',
            color: 'var(--slate-500)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="var(--emerald-600)" />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--slate-700)', display: 'block' }}>Dados protegidos</span>
              <span>Segurança máxima</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} color="var(--blue-600)" />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--slate-700)', display: 'block' }}>100% Moçambique</span>
              <span>Leis e prazos actualizados</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Headphones size={16} color="var(--gold-600)" />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--slate-700)', display: 'block' }}>Suporte dedicado</span>
              <span>Estamos aqui para ajudar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
