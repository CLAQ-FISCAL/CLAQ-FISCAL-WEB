import React, { useState } from 'react';
import {
  Mail,
  FileText,
  Calendar,
  ExternalLink,
  BookOpen,
  Send,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { OFFICIAL_GAZETTE_FEED } from '../data/officialGazetteFeed';
import { useAppState } from '../context/AppStateContext';

export const Newsletter: React.FC = () => {
  const { addToast } = useAppState();
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscriberEmail) {
      addToast('success', 'Subscrição Concluída!', `Enviaremos o resumo fiscal semanal para ${subscriberEmail}.`);
      setSubscriberEmail('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
          Newsletter & Boletim Fiscal
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
          Mantenha-se informado sobre alterações legislativas, novos decretos e prazos da Autoridade Tributária.
        </p>
      </div>

      {/* Subscribe Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B132B 0%, #0F172A 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}
      >
        <div style={{ maxWidth: '520px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#F59E0B" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Boletim Semanal Gratuito
            </span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
            Receba actualizações tributárias no seu e-mail todas as segundas-feiras
          </h3>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px', lineHeight: 1.4 }}>
            Análise jurídica comentada por consultores da CLAQ com impacto prático no seu negócio em Moçambique.
          </p>
        </div>

        <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
          <input
            type="email"
            placeholder="o.seu.email@empresa.co.mz"
            className="form-control"
            value={subscriberEmail}
            onChange={e => setSubscriberEmail(e.target.value)}
            style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
            required
          />
          <button type="submit" className="btn btn-primary-gold" style={{ flexShrink: 0 }}>
            <Send size={15} />
            <span>Subscrever</span>
          </button>
        </form>
      </div>

      {/* News Feed Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {OFFICIAL_GAZETTE_FEED.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedNews(item)}
            className="card card-hover"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-amber" style={{ fontSize: '11px' }}>
                  {item.category}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                  {item.date} • {item.readTime}
                </span>
              </div>

              <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1.3 }}>
                {item.title}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '8px', lineHeight: 1.5 }}>
                {item.summary}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--slate-100)', paddingTop: '12px', fontSize: '12px', color: 'var(--slate-400)' }}>
              <span>Fonte: {item.source}</span>
              <span style={{ color: 'var(--blue-600)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ler artigo completo →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
