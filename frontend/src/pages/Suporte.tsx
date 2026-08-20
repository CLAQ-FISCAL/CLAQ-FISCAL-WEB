import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

export const Suporte: React.FC = () => {
  const { addToast, setIsWhatsAppModalOpen, setIsAIAssistantOpen } = useAppState();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Qual é o prazo legal para entrega e pagamento da declaração periódica do IVA (Modelo A)?',
      a: 'Nos termos do Código do IVA moçambicano (Lei n.º 32/2007 e Lei n.º 1/2018), a declaração periódica e o respectivo pagamento devem ser efectuados até ao último dia útil do mês seguinte àquele a que respeitam as operações.'
    },
    {
      q: 'Como funciona a retenção na fonte de IRPC para serviços prestados por não residentes?',
      a: 'Aplica-se a taxa de 20% a título definitivo (Art. 66 do CIRPC) calculada sobre a base de incidência majorada pelo fator de contra-valor (1,25), salvo se existir Convenção de Dupla Tributação (CDT) ratificada com taxa reduzida (ex: 10% com Portugal ou África do Sul) mediante Certificado de Residência Fiscal.'
    },
    {
      q: 'Até que dia deve ser submetida a folha de salários e pagas as contribuições do INSS?',
      a: 'As folhas de remuneração devem ser carregadas e o valor correspondente (3% trabalhador + 4% patronal) liquidado até ao dia 10 do mês seguinte àquele a que dizem respeito.'
    },
    {
      q: 'O que acontece se uma empresa pagar o imposto fora do prazo legal?',
      a: 'Conforme o Artigo 101 da Lei Geral Tributária (Lei n.º 15/2002), o atraso no pagamento sujeita o contribuinte a uma multa de 25% a 100% do imposto devido, acrescida de juros de mora calculados à taxa de referência (MIMO) do Banco de Moçambique acrescida de 2 pontos percentuais.'
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      addToast('success', 'Mensagem Enviada!', 'A equipa técnica da CLAQ Consultores responderá no prazo de 2 horas úteis.');
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
          Ajuda & Suporte Técnico Especializado
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
          Entre em contacto directo com os consultores fiscais e contabilistas da CLAQ Moçambique.
        </p>
      </div>

      {/* Top 3 Quick Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div
          onClick={() => setIsWhatsAppModalOpen(true)}
          className="card card-hover"
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', backgroundColor: '#ECFDF5', borderColor: 'rgba(16, 185, 129, 0.3)' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color="#FFFFFF" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>WhatsApp Direto</h4>
            <p style={{ fontSize: '12px', color: '#047857' }}>+258 84 123 4567 • Atendimento Instantâneo</p>
          </div>
        </div>

        <div
          onClick={() => setIsAIAssistantOpen(true)}
          className="card card-hover"
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', backgroundColor: 'var(--blue-50)', borderColor: 'rgba(37, 99, 235, 0.3)' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} color="#FFFFFF" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF' }}>Assistente CLAQ AI</h4>
            <p style={{ fontSize: '12px', color: '#1D4ED8' }}>Respostas imediatas 24/7 sobre leis fiscais</p>
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--gold-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={22} color="var(--gold-600)" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>Escritório Maputo</h4>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Av. 24 de Julho, Platinum 5º Andar</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: FAQ & Contact Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* FAQ Accordion */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            Perguntas Frequentes (FAQ Tributário)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--slate-200)',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? 'var(--slate-50)' : '#FFFFFF'
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: 'var(--slate-800)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 16px 14px 16px', fontSize: '13px', color: 'var(--slate-600)', lineHeight: 1.55 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            Fale com um Consultor CLAQ
          </h3>

          <form onSubmit={handleSendMessage}>
            <div className="form-group">
              <label className="form-label">Assunto</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Dúvida sobre retenção de IRPS ou declaração de IVA"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">A sua mensagem ou dúvida técnica</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="Descreva a sua questão fiscal ou suporte pretendido..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary-gold" style={{ width: '100%', padding: '12px' }}>
              <Send size={16} />
              <span>Enviar Pedido de Suporte</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
