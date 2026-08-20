import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  badge?: string;
}

export const AIAssistantDrawer: React.FC = () => {
  const {
    isAIAssistantOpen,
    setIsAIAssistantOpen,
    aiAssistantPrompt,
    openPDFPreview,
    activeSimulationResult
  } = useAppState();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Olá Carlos! Sou o seu Assistente Fiscal CLAQ AI especializado no sistema tributário moçambicano. Posso analisar memórias de cálculo, interpretar artigos do Código do IVA, IRPC, IRPS, verificar convenções de dupla tributação ou esclarecer prazos da Autoridade Tributária. Como posso ajudar hoje?',
      time: 'Agora'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiAssistantPrompt) {
      handleSendMessage(aiAssistantPrompt);
    }
  }, [aiAssistantPrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const predefinedPrompts = [
    'Como funciona o fator de gross-up 1,25?',
    'Moçambique tem convenção de dupla tributação com EUA?',
    'Qual o prazo de pagamento do IVA em operações ao exterior?',
    'Como deduzir IVA de faturas com retenção na fonte?'
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('1,25') || lower.includes('fator') || lower.includes('gross-up')) {
        reply = `**Explicação do Fator 1,25 (Gross-up):**\n\nConforme o Ofício Circular n.º 3012/AT/2021 e a prática fiscal moçambicana, quando um contrato estipula que os impostos em Moçambique correm por conta do adquirente residente (*net of tax*), a base tributável deve ser recalculada.\n\n$$\\text{Base} = \\frac{\\text{Valor Líquido}}{1 - (\\text{IRPC} 20\\%)} = \\frac{100\\%}{80\\%} = 1,25$$\n\nPortanto, multiplica-se o valor em Meticais por 1,25 para encontrar o Contra-Valor sobre o qual incidem o IVA (16%) e o IRPC retido na fonte (20%).`;
      } else if (lower.includes('convenção') || lower.includes('dupla tributação') || lower.includes('dta') || lower.includes('eua') || lower.includes('estados unidos')) {
        reply = `**Convenções de Dupla Tributação (CDT / DTA):**\n\n1. Moçambique **NÃO possui** actualmente Convenção de Dupla Tributação em vigor com os **Estados Unidos da América (EUA)**. Aplica-se a taxa padrão de retenção de 20% de IRPC (Art. 66 do CIRPC).\n\n2. Moçambique possui convenções ratificadas com: **Portugal (taxa reduzida de 10%), África do Sul (10%), Itália, Emirados Árabes Unidos, Índia, Macau, Maurícias, Vietname e Botswana**.\n\nPara beneficiar de taxas reduzidas, o prestador deve apresentar o Certificado de Residência Fiscal emitido pela autoridade do país de origem antes do pagamento.`;
      } else if (lower.includes('prazo') || lower.includes('pagamento') || lower.includes('modelo a')) {
        reply = `**Prazos Oficiais de Cumprimento:**\n\n- **IVA (Modelo A):** Deve ser submetido e pago até ao **último dia útil do mês seguinte** àquele a que respeitam as operações (ex.: IVA de Junho vence a 30 de Junho / Julho).\n- **IRPC Retenção na Fonte (Guia M/11):** Deve ser entregue e pago até ao **dia 20 do mês seguinte** ao da realização da retenção.\n- **INSS (Folha de Salários):** Até ao **dia 10 do mês seguinte**.`;
      } else if (lower.includes('revisão') || lower.includes('analisar')) {
        reply = `**Análise e Validação Fiscal Concluída ✓**\n\nExaminámos os valores da simulação actual:\n- Valor em MZN: 637.500,00 MZN\n- Base recalculada (Fator 1,25): 796.875,00 MZN\n- IVA (16%): 127.500,00 MZN\n- IRPC (20%): 159.375,00 MZN\n- Total de Tributos: 286.875,00 MZN\n\nTodos os cálculos estão em estrita conformidade com a Lei n.º 1/2018 (CIVA) e Lei n.º 34/2014 (CIRPC). Pode gerar o relatório oficial com carimbo digital da CLAQ.`;
      } else {
        reply = `Compreendi a sua questão sobre **"${text}"**.\n\nDe acordo com o quadro fiscal moçambicano e as orientações da Autoridade Tributária de Moçambique (AT), todas as operações financeiras e contratuais devem ter suporte documental com NUIT válido, fatura carimbada e retenções efectuadas no momento do pagamento ou colocação à disposição.\n\nDeseja que prepare uma memória de cálculo detalhada ou consulte um artigo específico da legislação?`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Legislação Moçambicana 2026'
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  if (!isAIAssistantOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 19, 43, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={() => setIsAIAssistantOpen(false)}
    >
      <div
        style={{
          width: '460px',
          maxWidth: '100%',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 22px',
            background: 'linear-gradient(135deg, #0B132B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
              }}
            >
              <Bot size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                  Assistente CLAQ AI
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '999px'
                  }}
                >
                  ONLINE
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                Inteligência fiscal moçambicana em tempo real
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIAssistantOpen(false)}
            className="btn btn-ghost"
            style={{ color: '#94A3B8', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--slate-50)',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {predefinedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--slate-700)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--slate-300)',
                padding: '5px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--blue-600)';
                e.currentTarget.style.color = 'var(--blue-600)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--slate-300)';
                e.currentTarget.style.color = 'var(--slate-700)';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div
          style={{
            flex: 1,
            padding: '18px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#F8FAFC'
          }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '4px'
              }}
            >
              <div
                style={{
                  maxWidth: '88%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  borderTopRightRadius: msg.sender === 'user' ? '2px' : '14px',
                  borderTopLeftRadius: msg.sender === 'ai' ? '2px' : '14px',
                  backgroundColor: msg.sender === 'user' ? '#2563EB' : '#FFFFFF',
                  color: msg.sender === 'user' ? '#FFFFFF' : 'var(--slate-800)',
                  boxShadow: msg.sender === 'ai' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                  border: msg.sender === 'ai' ? '1px solid var(--slate-200)' : 'none',
                  fontSize: '13.5px',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.text}
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--slate-400)', padding: '0 4px' }}>
                {msg.time} {msg.badge ? `• ${msg.badge}` : ''}
              </span>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--slate-200)' }}>
              <Sparkles size={16} color="var(--gold-600)" />
              <span style={{ fontSize: '12.5px', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                CLAQ AI a analisar legislação moçambicana...
              </span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--slate-200)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Faça uma pergunta sobre impostos moçambicanos..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            className="btn btn-primary-blue"
            style={{ padding: '10px 14px', flexShrink: 0 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
