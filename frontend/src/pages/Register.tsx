import React, { useState } from 'react';
import { ArrowLeft, Briefcase, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClaqLogo } from '../components/common/ClaqLogo';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { useAppState } from '../context/AppStateContext';
import { readAudience } from '../lib/audience';
import type { Audience } from '../types';

interface RegisterProps {
  onBack: () => void;
  onRegistrationComplete: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', fontSize: '14px', color: '#0F172A',
  border: '1px solid #CBD5E1', borderRadius: '10px', boxSizing: 'border-box'
};

export const Register: React.FC<RegisterProps> = ({ onBack, onRegistrationComplete }) => {
  const { t } = useTranslation();
  const { registerUser } = useAppState();
  const audience: Audience = readAudience() ?? 'empresa';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [nuit, setNuit] = useState('');
  const [province, setProvince] = useState('Maputo Cidade');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const success = await registerUser({
      name: fullName,
      email,
      phone: phone || '+258 84 000 0000',
      companyName,
      companyNuit: nuit,
      companyProvince: province,
      companyCity: province.includes('Maputo') ? 'Maputo' : province,
      role: audience === 'contabilidade' ? 'ACCOUNTING_ADMIN' : 'COMPANY_ADMIN',
      plan: audience === 'contabilidade' ? 'Contabilidade' : 'PME',
      password
    }, { signInAfterRegister: false });
    setIsLoading(false);
    if (success) onRegistrationComplete();
  };

  return (
    <main style={{ minHeight: '100vh', background: '#070E1E', padding: '28px 20px 48px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ position: 'absolute', top: 20, right: 24 }}><LanguageToggle variant="dark" /></div>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <ClaqLogo variant="dark" size="lg" />
        <section style={{ marginTop: '28px', background: '#FFFFFF', borderRadius: '22px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
          <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0, border: 0, background: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>
            <ArrowLeft size={15} />{t('onboarding:back')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontWeight: 700, fontSize: 13 }}>
            {audience === 'empresa' ? <Building2 size={16} /> : <Briefcase size={16} />}
            {audience === 'empresa' ? t('onboarding:audienceCompany') : t('onboarding:audienceAccountant')}
          </div>
          <h1 style={{ margin: '12px 0 4px', color: '#0F172A', fontSize: 25, fontWeight: 800 }}>{t('login:registerTitle')}</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>{t('login:registerSubtitle')}</p>

          <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            <label style={{ display: 'grid', gap: 5, color: '#334155', fontSize: 13, fontWeight: 600 }}>
              {t('login:fullName')}
              <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('login:fullNamePlaceholder')} required autoComplete="name" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 5, color: '#334155', fontSize: 13, fontWeight: 600 }}>
                {t('login:corporateEmail')}
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@empresa.co.mz" required autoComplete="email" />
              </label>
              <label style={{ display: 'grid', gap: 5, color: '#334155', fontSize: 13, fontWeight: 600 }}>
                {t('login:phone')}
                <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+258 84..." autoComplete="tel" />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 5, color: '#334155', fontSize: 13, fontWeight: 600 }}>
                {audience === 'empresa' ? t('login:companyName') : t('login:accountingFirmName')}
                <input style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={t('login:companyNamePlaceholder')} required autoComplete="organization" />
              </label>
              <label style={{ display: 'grid', gap: 5, color: '#334155', fontSize: 13, fontWeight: 600 }}>
                {t('login:nuitLabel')}
                <input style={inputStyle} value={nuit} onChange={e => setNuit(e.target.value.replace(/\D/g, '').slice(0, 9))} inputMode="numeric" placeholder="400123456" required />
              </label>
            </div>
            <label style={{ display: 'grid', gap: 5, color: '#334155', fontSize: 13, fontWeight: 600 }}>
              {t('login:fiscalProvince')}
              <select style={{ ...inputStyle, background: '#FFFFFF' }} value={province} onChange={e => setProvince(e.target.value)}>
                <option value="Maputo Cidade">Maputo Cidade</option><option value="Maputo Província">Maputo Província (Matola)</option>
                <option value="Sofala">Sofala (Beira)</option><option value="Tete">Tete</option><option value="Nampula">Nampula</option>
                <option value="Cabo Delgado">Cabo Delgado (Pemba)</option><option value="Zambézia">Zambézia (Quelimane)</option>
                <option value="Manica">Manica (Chimoio)</option><option value="Gaza">Gaza (Xai-Xai)</option>
                <option value="Inhambane">Inhambane</option><option value="Niassa">Niassa (Lichinga)</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5, color: '#334155', fontSize: 13, fontWeight: 600 }}>
              {t('login:accessPassword')}
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login:passwordPlaceholderMin')} minLength={8} required autoComplete="new-password" />
            </label>
            <button type="submit" disabled={isLoading} style={{ marginTop: 4, width: '100%', padding: 13, border: 0, borderRadius: 11, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#FFFFFF', fontSize: 14, fontWeight: 800, cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? .7 : 1 }}>
              {isLoading ? t('login:creatingAccount') : t('login:createAccountStart')}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
