import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Percent,
  Calculator,
  Globe,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../context/AppStateContext';
import { ClaqLogoMark } from '../common/ClaqLogo';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  badge?: string;
}

type MessageFeedback = 'helpful' | 'notHelpful';

export const AIAssistantDrawer: React.FC = () => {
  const { t } = useTranslation();
  const {
    isAIAssistantOpen,
    setIsAIAssistantOpen,
    aiAssistantPrompt,
    addToast
  } = useAppState();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: t('ai:welcomeMessage'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<string, MessageFeedback>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (aiAssistantPrompt) {
      handleSendMessage(aiAssistantPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAssistantPrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickTopics = [
    { icon: Percent, color: '#60A5FA', label: t('ai:qtVatWithholdingLabel'), query: t('ai:qtVatWithholdingQuery') },
    { icon: Calculator, color: '#34D399', label: t('ai:qtGrossUpLabel'), query: t('ai:qtGrossUpQuery') },
    { icon: Globe, color: '#A78BFA', label: t('ai:qtIRPCNonResLabel'), query: t('ai:qtIRPCNonResQuery') },
    { icon: FileCheck, color: '#F59E0B', label: t('ai:qtDTTLabel'), query: t('ai:qtDTTQuery') },
    { icon: FileCheck, color: '#38BDF8', label: t('ai:qtVatModelALabel'), query: t('ai:qtVatModelAQuery') },
    { icon: Calculator, color: '#22D3EE', label: t('ai:qtIRPSWithholdingLabel'), query: t('ai:qtIRPSWithholdingQuery') }
  ];

  const predefinedPrompts = [
    t('ai:promptGrossUp'),
    t('ai:promptDTA'),
    t('ai:promptIVADeadline'),
    t('ai:promptIVADeduct')
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) {
      setInputMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '36px';
      }
    }
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('1,25') || lower.includes('1.25') || lower.includes('fator') || lower.includes('factor') || lower.includes('gross-up') || lower.includes('gross up') || lower.includes('majoração')) {
        reply = t('ai:replyGrossUp');
      } else if (lower.includes('convenção') || lower.includes('dupla tributação') || lower.includes('dta') || lower.includes('double tax') || lower.includes('treaty') || lower.includes('portugal') || lower.includes('áfrica do sul') || lower.includes('south africa')) {
        reply = t('ai:replyDTA');
      } else if (lower.includes('prazo') || lower.includes('deadline') || lower.includes('pagamento') || lower.includes('payment') || lower.includes('modelo a') || lower.includes('iva')) {
        reply = t('ai:replyDeadlines');
      } else if (lower.includes('irpc') || lower.includes('non-resident') || lower.includes('não residente')) {
        reply = t('ai:replyIRPC');
      } else if (lower.includes('irps') || lower.includes('retenção') && lower.includes('irps')) {
        reply = t('ai:replyIRPS');
      } else if (lower.includes('revisão') || lower.includes('review') || lower.includes('analisar') || lower.includes('analys') || lower.includes('analy')) {
        reply = t('ai:replyReview');
      } else {
        reply = t('ai:replyDefault');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: t('ai:badgeLegislation')
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handleClearChat = () => {
    setFeedbackByMessage({});
    setMessages([
      {
        id: 'msg-1',
        sender: 'ai',
        text: t('ai:welcomeMessage'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
  };

  const copyMessage = async (text: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      addToast('success', t('ai:copySuccessTitle'), t('ai:copySuccessMessage'));
    } catch {
      addToast('error', t('ai:copyErrorTitle'), t('ai:copyErrorMessage'));
    }
  };

  const recordFeedback = (messageId: string, feedback: MessageFeedback) => {
    if (feedbackByMessage[messageId]) return;
    setFeedbackByMessage(prev => ({ ...prev, [messageId]: feedback }));
    addToast('success', t('ai:feedbackRecordedTitle'), t(feedback === 'helpful' ? 'ai:helpfulFeedbackMessage' : 'ai:notHelpfulFeedbackMessage'));
  };

  if (!isAIAssistantOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); } }
        .ai-scrollbar::-webkit-scrollbar { width: 6px; }
        .ai-scrollbar::-webkit-scrollbar-track { background: rgba(11, 19, 43, 0.5); }
        .ai-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 9999px; }
        .ai-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(58, 134, 255, 0.5); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ai-message-action:focus-visible { outline: 2px solid #60A5FA; outline-offset: 2px; }
        .ai-message-action:not(:disabled):hover { background-color: rgba(148, 163, 184, 0.12) !important; }
      `}</style>
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(7, 11, 25, 0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease' }}
        onClick={() => setIsAIAssistantOpen(false)}
      >
        <div
          style={{ width: '100%', maxWidth: '580px', height: '100vh', backgroundColor: 'rgba(11, 19, 43, 0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          onClick={e => e.stopPropagation()}
        >
          <header style={{ padding: '16px 20px', backgroundColor: 'rgba(7, 11, 25, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <ClaqLogoMark size={40} style={{ filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.18))' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>{t('ai:title')}</h2>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 8px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399', flexShrink: 0 }} />
                    {t('ai:online')}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <ShieldCheck size={12} color="#60A5FA" />
                  {t('ai:subtitle')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={handleClearChat} title={t('ai:clearChat')} style={{ padding: '8px', color: '#94A3B8', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <RotateCcw size={16} />
              </button>
              <button onClick={() => setIsAIAssistantOpen(false)} title={t('common:close') || 'Close'} style={{ padding: '8px', color: '#94A3B8', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="no-scrollbar" style={{ backgroundColor: '#0B132B', padding: '10px 20px 10px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{t('ai:quickTopics')}</span>
            {quickTopics.map((topic, idx) => (
              <button key={idx} onClick={() => handleSendMessage(topic.query)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: 500, color: '#E2E8F0', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.18)'; e.currentTarget.style.color = '#BFDBFE'; e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.6)'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#E2E8F0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                <topic.icon size={12} color={topic.color} style={{ flexShrink: 0 }} />
                <span>{topic.label}</span>
              </button>
            ))}
          </div>

          <div className="ai-scrollbar" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'linear-gradient(to bottom, #070B19 0%, #0B132B 50%, #070B19 100%)' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', maxWidth: msg.sender === 'user' ? '90%' : '92%', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.sender === 'ai' && (
                  <ClaqLogoMark size={32} style={{ filter: 'drop-shadow(0 3px 8px rgba(245, 158, 11, 0.16))' }} />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#E2E8F0' }}>{msg.sender === 'ai' ? t('ai:title') : t('ai:you')}</span>
                    {msg.sender === 'ai' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
                        <ShieldCheck size={10} />
                        {t('ai:verified')}
                      </span>
                    )}
                    <span style={{ fontSize: '10px', color: '#64748B' }}>{msg.time}</span>
                  </div>
                  <div style={{ padding: msg.sender === 'user' ? '14px 16px' : '16px 18px', borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: msg.sender === 'user' ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' : 'rgba(28, 37, 65, 0.7)', backdropFilter: msg.sender === 'ai' ? 'blur(16px)' : 'none', WebkitBackdropFilter: msg.sender === 'ai' ? 'blur(16px)' : 'none', color: '#F8FAFC', border: msg.sender === 'ai' ? '1px solid rgba(255, 255, 255, 0.09)' : 'none', boxShadow: msg.sender === 'user' ? '0 8px 24px rgba(37, 99, 235, 0.25)' : '0 10px 36px rgba(0, 0, 0, 0.35)', fontSize: '12px', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.text}
                  </div>
                  {msg.sender === 'ai' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' }}>
                        <button type="button" className="ai-message-action" onClick={() => void copyMessage(msg.text)} title={t('ai:copy')} aria-label={t('ai:copy')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94A3B8', backgroundColor: 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '4px 6px' }}>
                          <Copy size={11} />{t('ai:copy')}
                        </button>
                        <button type="button" className="ai-message-action" onClick={() => recordFeedback(msg.id, 'helpful')} disabled={Boolean(feedbackByMessage[msg.id])} aria-label={t('ai:helpful')} aria-pressed={feedbackByMessage[msg.id] === 'helpful'} title={t(feedbackByMessage[msg.id] === 'helpful' ? 'ai:feedbackRecorded' : 'ai:helpful')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: feedbackByMessage[msg.id] === 'helpful' ? '#34D399' : '#94A3B8', backgroundColor: feedbackByMessage[msg.id] === 'helpful' ? 'rgba(16, 185, 129, 0.12)' : 'transparent', border: feedbackByMessage[msg.id] === 'helpful' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent', borderRadius: '5px', cursor: feedbackByMessage[msg.id] ? 'default' : 'pointer', padding: '4px 6px', opacity: feedbackByMessage[msg.id] && feedbackByMessage[msg.id] !== 'helpful' ? 0.45 : 1 }}>
                          <ThumbsUp size={11} />{t(feedbackByMessage[msg.id] === 'helpful' ? 'ai:feedbackRecorded' : 'ai:helpful')}
                        </button>
                        <button type="button" className="ai-message-action" onClick={() => recordFeedback(msg.id, 'notHelpful')} disabled={Boolean(feedbackByMessage[msg.id])} aria-label={t('ai:notHelpful')} aria-pressed={feedbackByMessage[msg.id] === 'notHelpful'} title={t(feedbackByMessage[msg.id] === 'notHelpful' ? 'ai:feedbackRecorded' : 'ai:notHelpful')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: feedbackByMessage[msg.id] === 'notHelpful' ? '#F87171' : '#94A3B8', backgroundColor: feedbackByMessage[msg.id] === 'notHelpful' ? 'rgba(248, 113, 113, 0.12)' : 'transparent', border: feedbackByMessage[msg.id] === 'notHelpful' ? '1px solid rgba(248, 113, 113, 0.35)' : '1px solid transparent', borderRadius: '5px', cursor: feedbackByMessage[msg.id] ? 'default' : 'pointer', padding: '4px 6px', opacity: feedbackByMessage[msg.id] && feedbackByMessage[msg.id] !== 'notHelpful' ? 0.45 : 1 }}>
                          <ThumbsDown size={11} />{t(feedbackByMessage[msg.id] === 'notHelpful' ? 'ai:feedbackRecorded' : 'ai:notHelpful')}
                        </button>
                      </div>
                      <div style={{ marginLeft: '4px', paddingTop: '6px', borderTop: '1px solid rgba(148, 163, 184, 0.18)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('ai:sources')}</span>
                        <span style={{ fontSize: '9px', color: '#CBD5E1' }}>Autoridade Tributária de Moçambique (AT)</span>
                        <span style={{ fontSize: '9px', color: '#64748B' }}>•</span>
                        <span style={{ fontSize: '9px', color: '#CBD5E1' }}>Código do IVA / CIRPC / CIRPS</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', gap: '12px', maxWidth: '92%', alignSelf: 'flex-start' }}>
                <ClaqLogoMark size={32} style={{ filter: 'drop-shadow(0 3px 8px rgba(245, 158, 11, 0.16))' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#E2E8F0' }}>{t('ai:title')}</span>
                  <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(28, 37, 65, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#60A5FA', animation: 'bounce 1.4s infinite' }}></span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818CF8', animation: 'bounce 1.4s infinite', animationDelay: '0.2s' }}></span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22D3EE', animation: 'bounce 1.4s infinite', animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {messages.length === 1 && (
            <div style={{ padding: '16px 20px', backgroundColor: 'rgba(7, 11, 25, 0.9)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Sparkles size={14} color="#F59E0B" />
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('ai:frequentQueries')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {predefinedPrompts.map((prompt, idx) => (
                  <button key={idx} onClick={() => handleSendMessage(prompt)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', fontSize: '11px', color: '#CBD5E1', backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left', lineHeight: 1.4 }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.color = '#E2E8F0'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.4)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#CBD5E1'; }}>
                    <span style={{ flex: 1, paddingRight: '8px' }}>{prompt}</span>
                    <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(7, 11, 25, 0.95)' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', backgroundColor: 'rgba(11, 19, 43, 0.85)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '6px 8px' }}>
                <textarea ref={textareaRef} rows={1} placeholder={t('ai:inputPlaceholder')} value={inputMessage} onChange={handleInputChange} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#F1F5F9', fontSize: '12px', padding: '8px 6px', resize: 'none', maxHeight: '110px', minHeight: '36px', fontFamily: 'inherit', lineHeight: 1.5 }} />
                <button type="submit" disabled={!inputMessage.trim() || isTyping} style={{ padding: '10px', background: inputMessage.trim() && !isTyping ? 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)' : 'rgba(100, 116, 139, 0.3)', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: inputMessage.trim() && !isTyping ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: inputMessage.trim() && !isTyping ? '0 4px 16px rgba(37, 99, 235, 0.4)' : 'none', marginBottom: '2px', opacity: inputMessage.trim() && !isTyping ? 1 : 0.5 }}>
                  <Send size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '9px', color: '#64748B' }}>{t('ai:supportedCodes')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748B' }}><ShieldCheck size={10} />{t('ai:encrypted')}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
