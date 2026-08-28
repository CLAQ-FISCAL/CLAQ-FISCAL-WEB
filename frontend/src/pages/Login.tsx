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
  ArrowRight,
  Check,
  Scale,
  Sparkles,
  X
} from 'lucide-react';
import { ClaqLogo } from '../components/common/ClaqLogo';
import { useAppState } from '../context/AppStateContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, registerUser } = useAppState();

  // Login Form State
  const [emailOrNuit, setEmailOrNuit] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Register Modal State (Preserving full registration capability)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regCompanyNuit, setRegCompanyNuit] = useState('');
  const [regProvince, setRegProvince] = useState('Maputo Cidade');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrNuit || !password) return;

    setIsLoading(true);
    const success = await login(emailOrNuit, password);
    setIsLoading(false);
    if (success) onLoginSuccess();
  };

  const handleSocialLogin = (provider: string) => {
    void provider;
    alert('O início de sessão corporativo ainda não está configurado. Utilize as credenciais da sua conta.');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regCompanyName || !regCompanyNuit) return;

    setIsLoading(true);
    await registerUser({
        name: regFullName || 'Administrador',
        email: regEmail,
        phone: regPhone || '+258 84 000 0000',
        companyName: regCompanyName,
        companyNuit: regCompanyNuit,
        companyProvince: regProvince,
        companyCity: regProvince.includes('Maputo') ? 'Maputo' : regProvince,
        role: 'Contabilista / Administrador',
        password: regPassword
      });
    setIsLoading(false);
    setShowRegisterModal(false);
    onLoginSuccess();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        backgroundColor: '#070E1E',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* LEFT PANEL: Branding, Features, Bridge Image, Geometric Lines, Quote Swoosh */}
      <div
        style={{
          flex: '1 1 54%',
          minHeight: '100vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          color: '#FFFFFF',
          zIndex: 2,
          overflow: 'hidden'
        }}
      >
        {/* Background Bridge Image embedded seamlessly */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '62%',
            backgroundImage: `url('/maputo_bridge_night.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          {/* Top & Side Gradient Overlays to blend into dark navy */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, #070E1E 0%, rgba(7, 14, 30, 0.4) 40%, rgba(7, 14, 30, 0.75) 100%), linear-gradient(90deg, rgba(7, 14, 30, 0.6) 0%, transparent 60%, rgba(7, 14, 30, 0.8) 100%)'
            }}
          />
        </div>

        {/* Golden Geometric Orbital Arcs SVG */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 2
          }}
          viewBox="0 0 800 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main sweeping golden arc */}
          <path
            d="M 680 -50 C 600 200 480 340 580 520 C 640 620 620 780 720 950"
            stroke="url(#goldArcGradient)"
            strokeWidth="1.5"
            strokeDasharray="none"
            opacity="0.85"
          />
          {/* Secondary faint accent arc */}
          <path
            d="M 720 40 C 640 260 520 400 620 580"
            stroke="url(#goldArcGradient)"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.4"
          />
          <defs>
            <linearGradient id="goldArcGradient" x1="0" y1="0" x2="800" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="1" stopColor="#D97706" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Circular Highlight Badge Overlapping Bridge & Geometric Arc */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            right: '8%',
            transform: 'translate(50%, -50%)',
            zIndex: 4,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Outer Dashed Ring */}
          <div
            style={{
              position: 'absolute',
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              border: '1px dashed rgba(245, 158, 11, 0.35)',
              animation: 'spinSlow 30s linear infinite'
            }}
          />
          {/* Middle Solid Ring */}
          <div
            style={{
              position: 'absolute',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '1.5px solid rgba(245, 158, 11, 0.6)',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
            }}
          />
          {/* Inner Golden Badge */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
              border: '2px solid #FFFFFF'
            }}
          >
            <Check size={22} color="#070E1E" strokeWidth={3.2} />
          </div>
        </div>

        {/* Top Section: Logo, Main Headline, Subtitle, 4 Feature Items */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '520px' }}>
          {/* Logo */}
          <ClaqLogo variant="dark" size="lg" />

          {/* Main Headline */}
          <div style={{ marginTop: '36px' }}>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 800,
                lineHeight: '1.18',
                letterSpacing: '-0.8px',
                color: '#FFFFFF',
                margin: 0
              }}
            >
              Nunca mais perca
              <br />
              um <span style={{ color: '#F59E0B' }}>prazo fiscal</span>.
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: '#94A3B8',
                marginTop: '16px',
                lineHeight: '1.55',
                maxWidth: '460px'
              }}
            >
              O CLAQ Fiscal Alert ajuda empresas e contabilistas a cumprir todas as suas obrigações fiscais, laborais e municipais com antecedência.
            </p>
          </div>

          {/* 4 Feature Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
            {/* Item 1 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(245, 158, 11, 0.7)',
                  backgroundColor: 'rgba(7, 14, 30, 0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Bell size={18} color="#F59E0B" strokeWidth={2.2} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  Alertas personalizados
                </span>
                <span style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: '1.4' }}>
                  Receba lembretes automáticos antes dos prazos.
                </span>
              </div>
            </div>

            {/* Item 2 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(245, 158, 11, 0.7)',
                  backgroundColor: 'rgba(7, 14, 30, 0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Calendar size={18} color="#F59E0B" strokeWidth={2.2} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  Calendário Fiscal
                </span>
                <span style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: '1.4' }}>
                  Acompanhe todas as obrigações num só lugar.
                </span>
              </div>
            </div>

            {/* Item 3 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(245, 158, 11, 0.7)',
                  backgroundColor: 'rgba(7, 14, 30, 0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Calculator size={18} color="#F59E0B" strokeWidth={2.2} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  Simuladores Inteligentes
                </span>
                <span style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: '1.4' }}>
                  Calcule impostos, contribuições e muito mais.
                </span>
              </div>
            </div>

            {/* Item 4 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(245, 158, 11, 0.7)',
                  backgroundColor: 'rgba(7, 14, 30, 0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={18} color="#F59E0B" strokeWidth={2.2} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  Conformidade e Segurança
                </span>
                <span style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: '1.4' }}>
                  Mantenha a sua empresa sempre em conformidade.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left Corner: Golden Curve Testimonial Swoosh */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            marginTop: '40px',
            maxWidth: '380px'
          }}
        >
          {/* Background curved shape using SVG for organic flowing curve */}
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #B45309 0%, #D97706 35%, #F59E0B 75%, #FBBF24 100%)',
              borderTopRightRadius: '90px',
              borderBottomRightRadius: '90px',
              borderTopLeftRadius: '24px',
              borderBottomLeftRadius: '24px',
              padding: '24px 32px 24px 28px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* Quote Icon */}
            <div style={{ marginBottom: '8px', lineHeight: 1 }}>
              <span
                style={{
                  fontSize: '34px',
                  fontFamily: 'serif',
                  fontWeight: 900,
                  color: '#78350F',
                  lineHeight: 0.8,
                  display: 'inline-block'
                }}
              >
                “
              </span>
            </div>
            <p
              style={{
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#FFFFFF',
                lineHeight: '1.45',
                margin: 0
              }}
            >
              Mais organização, menos multas,
              <br />
              mais crescimento para o seu negócio.
            </p>
            <div style={{ marginTop: '10px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: '#FEF3C7',
                  letterSpacing: '0.2px'
                }}
              >
                CLAQ Consultores
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Crisp Light Area with Floating Login Card & Footer Trust Badges */}
      <div
        style={{
          flex: '1 1 46%',
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          zIndex: 3,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)'
        }}
      >
        {/* Decorative Dark Navy Accent Swoop in Bottom Right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            right: '-50px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            backgroundColor: '#070E1E',
            zIndex: 1,
            pointerEvents: 'none',
            opacity: 0.95
          }}
        />

        {/* Floating White Login Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '470px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '40px 38px',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0,0,0,0.03)',
            position: 'relative',
            zIndex: 2,
            border: '1px solid #F1F5F9'
          }}
        >
          {/* Lock Badge Header */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                backgroundColor: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)',
                border: '1px solid #1E293B'
              }}
            >
              <Lock size={24} color="#F59E0B" strokeWidth={2.4} />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.4px',
                margin: 0
              }}
            >
              Bem-vindo de volta! 👋
            </h2>
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748B',
                marginTop: '6px',
                fontWeight: 500,
                margin: '6px 0 0 0'
              }}
            >
              Faça login para aceder à sua conta
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit}>
            {/* Field: Email ou NUIT */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px'
                }}
              >
                Email ou NUIT
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="exemplo@empresa.co.mz"
                  value={emailOrNuit}
                  onChange={e => setEmailOrNuit(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    fontSize: '14px',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#F59E0B';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <Mail
                  size={18}
                  color="#94A3B8"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>

            {/* Field: Senha */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px'
                }}
              >
                Senha
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    fontSize: '14px',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#F59E0B';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <Lock
                  size={18}
                  color="#94A3B8"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    pointerEvents: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Lembrar-me & Esqueceu a senha */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#475569',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontWeight: 500
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#2563EB',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                Lembrar-me
              </label>
              <a
                href="#forgot"
                onClick={e => {
                  e.preventDefault();
                  alert('Para redefinir a sua senha, contacte o suporte CLAQ ou o administrador da sua empresa.');
                }}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#2563EB',
                  textDecoration: 'none'
                }}
              >
                Esqueceu a senha?
              </a>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 700,
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(245, 158, 11, 0.45)';
                }
              }}
              onMouseLeave={e => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.35)';
                }
              }}
            >
              {isLoading ? (
                'A entrar...'
              ) : (
                <>
                  Entrar na sua conta
                  <ArrowRight size={17} strokeWidth={2.4} />
                </>
              )}
            </button>
          </form>

          {/* SSO Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '24px 0 18px 0',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
              ou continuar com
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Social SSO Authentication Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px'
            }}
          >
            {/* Google SSO */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 8px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Google
            </button>

            {/* Microsoft SSO */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Microsoft')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 8px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              Microsoft
            </button>

            {/* Apple SSO */}
            <button
              type="button"
              onClick={() => handleSocialLogin('Apple')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 8px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 170 170" fill="#0F172A">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.86-11.74-14.44-6.3-9.98-11.02-21.75-14.15-35.31-3.13-13.56-4.7-25.99-4.7-37.3 0-14.99 3.84-27.46 11.51-37.42 7.68-9.96 17.38-14.99 29.1-15.11 4.58 0 9.77 1.17 15.58 3.5 5.81 2.34 9.48 3.55 11.01 3.64 1.31 0 5.17-1.32 11.58-3.95 6.41-2.63 11.95-3.8 16.63-3.5 12.39.63 22.37 5.09 29.96 13.38-10.89 6.64-16.22 15.77-15.99 27.38.23 9.07 3.63 16.71 10.2 22.92 6.57 6.21 14.4 9.68 23.49 10.41-2.22 6.64-4.86 13.06-7.92 19.26zm-36.95-103.8c0-7.39 2.65-14.15 7.95-20.28 5.3-6.13 11.83-9.7 19.59-10.71.74 4.8 0 9.87-2.23 15.22-2.23 5.35-5.36 9.85-9.39 13.5-3.81 3.48-8.08 5.66-12.82 6.53-.44-1.41-.67-2.83-.67-4.26z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Bottom Sign-up CTA */}
          <div style={{ textAlign: 'center', marginTop: '26px' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Criar conta grátis →
              </button>
            </span>
          </div>
        </div>

        {/* FOOTER TRUST BADGES (Centered under the Card) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            marginTop: '32px',
            position: 'relative',
            zIndex: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* Badge 1: Dados protegidos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1.5px solid #0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={16} color="#0F172A" strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Dados protegidos
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.2 }}>
                Segurança máxima
              </span>
            </div>
          </div>

          {/* Badge 2: 100% Moçambique */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1.5px solid #0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Scale size={15} color="#0F172A" strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                100% Moçambique
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.2 }}>
                Leis e prazos atualizados
              </span>
            </div>
          </div>

          {/* Badge 3: Suporte dedicado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1.5px solid #0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Headphones size={15} color="#0F172A" strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Suporte dedicado
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.2 }}>
                Estamos aqui para ajudar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REGISTRATION MODAL (Preserves full registration functionality while keeping the clean UI) */}
      {showRegisterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 14, 30, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '36px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Criar Nova Conta Empresarial
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                Registo rápido para empresas e gabinetes em Moçambique.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Apollo"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13.5px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    placeholder="admin@empresa.co.mz"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Telemóvel
                  </label>
                  <input
                    type="text"
                    placeholder="+258 84..."
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ABC Serviços, Lda"
                    value={regCompanyName}
                    onChange={e => setRegCompanyName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    NUIT (9 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="400123456"
                    value={regCompanyNuit}
                    onChange={e => setRegCompanyNuit(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Província Fiscal
                </label>
                <select
                  value={regProvince}
                  onChange={e => setRegProvince(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13.5px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="Maputo Cidade">Maputo Cidade</option>
                  <option value="Maputo Província">Maputo Província (Matola)</option>
                  <option value="Sofala">Sofala (Beira)</option>
                  <option value="Tete">Tete</option>
                  <option value="Nampula">Nampula</option>
                  <option value="Cabo Delgado">Cabo Delgado (Pemba)</option>
                  <option value="Zambézia">Zambézia (Quelimane)</option>
                  <option value="Manica">Manica (Chimoio)</option>
                  <option value="Gaza">Gaza (Xai-Xai)</option>
                  <option value="Inhambane">Inhambane</option>
                  <option value="Niassa">Niassa (Lichinga)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13.5px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {isLoading ? 'A criar conta...' : 'Criar Conta e Começar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
