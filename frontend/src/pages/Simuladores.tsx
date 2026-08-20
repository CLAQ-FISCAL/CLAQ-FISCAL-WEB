import React, { useState } from 'react';
import {
  Calculator,
  Search,
  Star,
  ArrowRight,
  ArrowLeft,
  Printer,
  Save,
  Download,
  FileSpreadsheet,
  Send,
  Sparkles,
  Bot,
  Info,
  CheckCircle2,
  ChevronRight,
  FileText,
  Trash2,
  Eye,
  ExternalLink,
  BookOpen,
  DollarSign,
  TrendingUp,
  Percent,
  Briefcase,
  HelpCircle,
  Share2,
  Users,
  Clock,
  Calendar
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  calculateNonResidentService,
  calculateSalary,
  calculateIVAOperations,
  calculateFines,
  MOCK_EXCHANGE_RATES,
  NonResidentServiceResult
} from '../data/taxEngine';
import { formatMZN, formatDate, formatCurrency } from '../utils/formatters';

interface SimuladoresProps {
  onNavigate: (path: string) => void;
}

export const Simuladores: React.FC<SimuladoresProps> = ({ onNavigate }) => {
  const {
    user,
    simulations,
    saveSimulation,
    deleteSimulation,
    openPDFPreview,
    openAIAssistantWithPrompt,
    addToast
  } = useAppState();

  // Active Main Tab: 'catalog' | 'non-resident' | 'salary' | 'iva' | 'fines' | 'history'
  const [activeSimulator, setActiveSimulator] = useState<string>('non-resident');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(2); // Default to Step 2/3 for rich results
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['non-resident', 'iva-ops', 'salario']);

  // Non-Resident Services Inputs State
  const [providerName, setProviderName] = useState('Google LLC');
  const [providerCountry, setProviderCountry] = useState('Estados Unidos');
  const [currency, setCurrency] = useState('USD');
  const [invoiceAmount, setInvoiceAmount] = useState('10000');
  const [exchangeRate, setExchangeRate] = useState('63.75');
  const [paymentDate, setPaymentDate] = useState('2026-07-15');
  const [description, setDescription] = useState('Serviços de infraestrutura cloud e licenças de software corporativo');

  // Sub-tabs for Technical Panels in Results View
  const [activeTechnicalTab, setActiveTechnicalTab] = useState<'trace' | 'legal' | 'history'>('trace');
  const [legalSubTab, setLegalSubTab] = useState<'iva' | 'irpc' | 'conventions' | 'others'>('iva');

  // Calculation Result
  const [calcResult, setCalcResult] = useState<NonResidentServiceResult>(() => {
    return calculateNonResidentService({
      providerName: 'Google LLC',
      providerCountry: 'Estados Unidos',
      currency: 'USD',
      invoiceAmount: 10000,
      exchangeRate: 63.75,
      paymentDate: '2026-07-15',
      description: 'Serviços de infraestrutura cloud e licenças de software corporativo'
    });
  });

  // Salary Simulator State
  const [salaryGross, setSalaryGross] = useState('120000');
  const [salaryDeps, setSalaryDeps] = useState('2');
  const [salaryTransport, setSalaryTransport] = useState('5000');
  const [salaryFood, setSalaryFood] = useState('5000');

  // IVA Operations Simulator State
  const [ivaSales, setIvaSales] = useState('850000');
  const [ivaPurchases, setIvaPurchases] = useState('320000');

  // Fines Simulator State
  const [fineAmount, setFineAmount] = useState('127500');
  const [fineDays, setFineDays] = useState('45');

  // Handle Calculate Non-Resident
  const handleCalculateNonResident = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = calculateNonResidentService({
      providerName,
      providerCountry,
      currency,
      invoiceAmount: Number(invoiceAmount) || 0,
      exchangeRate: Number(exchangeRate) || 1,
      paymentDate,
      description
    });
    setCalcResult(result);
    setCurrentStep(2);
    addToast('success', 'Cálculo Concluído', 'Impostos calculados com base na legislação moçambicana.');
  };

  // Fetch Exchange Rate from Mock Banco de Moçambique
  const handleFetchExchangeRate = () => {
    const rate = MOCK_EXCHANGE_RATES[currency] || 63.75;
    setExchangeRate(rate.toFixed(2));
    addToast('info', 'Câmbio Actualizado', `Câmbio oficial ${currency}/MZN: ${rate.toFixed(2)} (Banco de Moçambique).`);
  };

  // Save current simulation to history
  const handleSaveCurrentSimulation = () => {
    const rec = saveSimulation({
      simulatorId: 'pagamento-nao-residentes',
      simulatorTitle: 'Pagamento de Serviços a Não Residentes',
      date: paymentDate,
      clientName: providerName,
      currency: currency,
      originalAmount: Number(invoiceAmount),
      exchangeRate: Number(exchangeRate),
      mznAmount: calcResult.mznAmount,
      factor: calcResult.factor,
      taxBase: calcResult.taxBase,
      ivaAmount: calcResult.ivaAmount,
      ivaRate: calcResult.ivaRate * 100,
      irpcAmount: calcResult.irpcAmount,
      irpcRate: calcResult.irpcRate * 100,
      totalTax: calcResult.totalTax,
      providerCountry: providerCountry,
      description: description,
      status: 'concluido',
      responsibleName: user?.name || 'Carlos Apollo'
    });
    return rec;
  };

  // Export Excel CSV
  const handleExportCSV = () => {
    const rows = [
      ['SIMULACAO FISCAL - CLAQ FISCAL ALERT'],
      ['Prestador', providerName],
      ['Pais', providerCountry],
      ['Moeda Original', `${invoiceAmount} ${currency}`],
      ['Cambio (MZN)', exchangeRate],
      ['Valor em Meticais', calcResult.mznAmount],
      ['Contra-Valor (Fator 1.25)', calcResult.taxBase],
      ['IVA a Pagar (16%)', calcResult.ivaAmount],
      ['IRPC Retido (20%)', calcResult.irpcAmount],
      ['Total de Impostos a Pagar', calcResult.totalTax],
      ['Data', paymentDate],
      ['Responsavel', user?.name || 'Carlos Apollo']
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Simulacao_${providerName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Excel Exportado', 'Ficheiro de simulação descarregado.');
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => (prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]));
  };

  const simulatorCatalog = [
    {
      id: 'non-resident',
      category: 'Fiscal',
      title: 'Pagamento de Serviços a Não Residentes',
      desc: 'Calcule IVA e IRPC sobre pagamentos ao exterior.',
      icon: DollarSign,
      color: '#2563EB',
      bg: 'var(--blue-50)'
    },
    {
      id: 'iva-ops',
      category: 'Fiscal',
      title: 'IVA – Operações',
      desc: 'Calcule o IVA a pagar ou recuperar nas operações.',
      icon: Percent,
      color: '#D97706',
      bg: 'var(--gold-50)'
    },
    {
      id: 'irps-ret',
      category: 'Fiscal',
      title: 'IRPS – Retenções',
      desc: 'Calcule o imposto sobre rendimentos de trabalho.',
      icon: Users,
      color: '#059669',
      bg: 'var(--emerald-50)'
    },
    {
      id: 'irpc-est',
      category: 'Fiscal',
      title: 'IRPC – Estimativa',
      desc: 'Calcule o IRPC estimado da sua empresa.',
      icon: TrendingUp,
      color: '#7C3AED',
      bg: '#FAF5FF'
    },
    {
      id: 'inss-cont',
      category: 'Fiscal',
      title: 'INSS – Contribuições',
      desc: 'Calcule as contribuições ao INSS trabalhador e patronal.',
      icon: Briefcase,
      color: '#0284C7',
      bg: '#F0F9FF'
    },
    {
      id: 'fines',
      category: 'Fiscal',
      title: 'Juros e Multas',
      desc: 'Calcule juros e multas por incumprimento fiscal.',
      icon: Info,
      color: '#DC2626',
      bg: 'var(--red-50)'
    },
    {
      id: 'stamp-tax',
      category: 'Fiscal',
      title: 'Imposto de Selo',
      desc: 'Calcule o imposto de selo aplicável a contratos e recibos.',
      icon: FileText,
      color: '#475569',
      bg: 'var(--slate-100)'
    },
    {
      id: 'salario',
      category: 'Laboral (RH)',
      title: 'Salário Líquido',
      desc: 'Calcule o salário líquido do colaborador após descontos legais.',
      icon: Calculator,
      color: '#2563EB',
      bg: 'var(--blue-50)'
    },
    {
      id: 'extra-hours',
      category: 'Laboral (RH)',
      title: 'Horas Extras',
      desc: 'Calcule o valor das horas extras a pagar.',
      icon: Clock,
      color: '#D97706',
      bg: 'var(--gold-50)'
    },
    {
      id: 'vacations',
      category: 'Laboral (RH)',
      title: 'Férias',
      desc: 'Calcule dias e valores de férias dos trabalhadores.',
      icon: Calendar,
      color: '#059669',
      bg: 'var(--emerald-50)'
    },
    {
      id: 'indemnity',
      category: 'Laboral (RH)',
      title: 'Indemnização',
      desc: 'Calcule a indemnização por cessação de contrato.',
      icon: Briefcase,
      color: '#EA580C',
      bg: '#FFF7ED'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 01 - CENTRO DE SIMULADORES CATALOG VIEW (If activeSimulator === 'catalog') */}
      {activeSimulator === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Centro de Simuladores
              </h1>
              <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
                Escolha um simulador e obtenha cálculos automáticos com base na legislação moçambicana.
              </p>
            </div>

            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className="btn btn-secondary"
              style={{ color: favoritesOnly ? 'var(--gold-600)' : 'var(--slate-700)', borderColor: favoritesOnly ? 'var(--gold-500)' : 'var(--slate-200)' }}
            >
              <Star size={16} fill={favoritesOnly ? '#F59E0B' : 'none'} color="#F59E0B" />
              <span>Meus Favoritos ({favorites.length})</span>
            </button>
          </div>

          {/* Category Tabs & Search Bar */}
          <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Todos', 'Fiscal', 'Laboral (RH)', 'Contabilidade', 'Legal', 'Financeiro'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: categoryFilter === cat ? 'var(--blue-600)' : 'transparent',
                    color: categoryFilter === cat ? '#FFFFFF' : 'var(--slate-600)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px', fontSize: '13px' }}
                placeholder="Pesquisar simulador..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Simuladores Fiscais */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-800)', marginBottom: '14px', letterSpacing: '0.02em' }}>
                Simuladores Fiscais
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {simulatorCatalog
                  .filter(s => s.category === 'Fiscal')
                  .filter(s => !favoritesOnly || favorites.includes(s.id))
                  .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(sim => {
                    const Icon = sim.icon;
                    const isFav = favorites.includes(sim.id);
                    return (
                      <div
                        key={sim.id}
                        onClick={() => {
                          setActiveSimulator(sim.id === 'non-resident' ? 'non-resident' : sim.id === 'fines' ? 'fines' : 'non-resident');
                          setCurrentStep(1);
                        }}
                        className="card card-hover"
                        style={{ padding: '20px', cursor: 'pointer', position: 'relative' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: sim.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={22} color={sim.color} />
                          </div>
                          <button
                            onClick={e => toggleFavorite(sim.id, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                          >
                            <Star size={18} fill={isFav ? '#F59E0B' : 'none'} color={isFav ? '#F59E0B' : 'var(--slate-300)'} />
                          </button>
                        </div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--slate-900)' }}>
                          {sim.title}
                        </h4>
                        <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '4px', lineHeight: 1.4 }}>
                          {sim.desc}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Simuladores Laborais */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-800)', marginBottom: '14px', letterSpacing: '0.02em' }}>
                Simuladores Laborais (RH)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {simulatorCatalog
                  .filter(s => s.category === 'Laboral (RH)')
                  .filter(s => !favoritesOnly || favorites.includes(s.id))
                  .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(sim => {
                    const Icon = sim.icon;
                    const isFav = favorites.includes(sim.id);
                    return (
                      <div
                        key={sim.id}
                        onClick={() => {
                          setActiveSimulator(sim.id === 'salario' ? 'salary' : 'salary');
                          setCurrentStep(1);
                        }}
                        className="card card-hover"
                        style={{ padding: '20px', cursor: 'pointer', position: 'relative' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: sim.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={22} color={sim.color} />
                          </div>
                          <button
                            onClick={e => toggleFavorite(sim.id, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                          >
                            <Star size={18} fill={isFav ? '#F59E0B' : 'none'} color={isFav ? '#F59E0B' : 'var(--slate-300)'} />
                          </button>
                        </div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--slate-900)' }}>
                          {sim.title}
                        </h4>
                        <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '4px', lineHeight: 1.4 }}>
                          {sim.desc}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 02 & 03: SIMULATOR WORKFLOW (Pagamento de Serviços a Não Residentes) */}
      {activeSimulator === 'non-resident' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Breadcrumb & Navigation Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setActiveSimulator('catalog')}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--blue-600)', fontWeight: 600 }}
              >
                <ArrowLeft size={16} />
                <span>Voltar para Simuladores</span>
              </button>
              <div style={{ fontSize: '13px', color: 'var(--slate-400)' }}>
                Simuladores &gt; <span style={{ color: 'var(--slate-600)' }}>Fiscal</span> &gt; <span style={{ color: 'var(--slate-900)', fontWeight: 600 }}>Pagamento ao Exterior</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const rec = handleSaveCurrentSimulation();
                  openPDFPreview(rec);
                }}
                className="btn btn-secondary btn-sm"
              >
                <Printer size={15} />
                <span>Imprimir / PDF</span>
              </button>
              <button
                onClick={handleSaveCurrentSimulation}
                className="btn btn-secondary btn-sm"
              >
                <Save size={15} />
                <span>Guardar</span>
              </button>
            </div>
          </div>

          {/* Stepper Bar: (1) Dados -> (2) Resultados -> (3) Resumo */}
          <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div
                onClick={() => setCurrentStep(1)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: currentStep === 1 ? 'var(--blue-600)' : 'var(--emerald-500)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: currentStep === 1 ? 700 : 500, color: currentStep === 1 ? 'var(--blue-600)' : 'var(--slate-700)' }}>
                  Dados
                </span>
              </div>

              <div style={{ width: '60px', height: '2px', backgroundColor: currentStep >= 2 ? 'var(--blue-600)' : 'var(--slate-200)' }} />

              <div
                onClick={() => setCurrentStep(2)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: currentStep === 2 ? 'var(--blue-600)' : currentStep > 2 ? 'var(--emerald-500)' : 'var(--slate-200)',
                    color: currentStep >= 2 ? '#FFFFFF' : 'var(--slate-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  2
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: currentStep === 2 ? 700 : 500, color: currentStep === 2 ? 'var(--blue-600)' : 'var(--slate-700)' }}>
                  Resultados
                </span>
              </div>

              <div style={{ width: '60px', height: '2px', backgroundColor: currentStep >= 3 ? 'var(--blue-600)' : 'var(--slate-200)' }} />

              <div
                onClick={() => setCurrentStep(3)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: currentStep === 3 ? 'var(--blue-600)' : 'var(--slate-200)',
                    color: currentStep === 3 ? '#FFFFFF' : 'var(--slate-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  3
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: currentStep === 3 ? 700 : 500, color: currentStep === 3 ? 'var(--blue-600)' : 'var(--slate-700)' }}>
                  Resumo
                </span>
              </div>
            </div>
          </div>

          {/* STEP 1: INPUTS FORM (Matching Screenshot 2 - 02 Inputs do Simulador) */}
          {currentStep === 1 && (
            <div className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
                1. Informações do Pagamento
              </h2>

              <form onSubmit={handleCalculateNonResident}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Prestador do Serviço</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nome do prestador (Ex: Google LLC, Amazon AWS, Microsoft)"
                      value={providerName}
                      onChange={e => setProviderName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">País do Prestador</label>
                      <select
                        className="form-control"
                        value={providerCountry}
                        onChange={e => setProviderCountry(e.target.value)}
                      >
                        <option value="Estados Unidos">Estados Unidos (EUA)</option>
                        <option value="África do Sul">África do Sul</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Reino Unido">Reino Unido</option>
                        <option value="Brasil">Brasil</option>
                        <option value="Emirados Árabes Unidos">Emirados Árabes Unidos</option>
                        <option value="China">China</option>
                        <option value="Outro">Outro País</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Moeda da Fatura</label>
                      <select
                        className="form-control"
                        value={currency}
                        onChange={e => {
                          setCurrency(e.target.value);
                          setExchangeRate((MOCK_EXCHANGE_RATES[e.target.value] || 63.75).toFixed(2));
                        }}
                      >
                        <option value="USD">USD – Dólar Americano</option>
                        <option value="EUR">EUR – Euro</option>
                        <option value="ZAR">ZAR – Rand Sul-Africano</option>
                        <option value="GBP">GBP – Libra Esterlina</option>
                        <option value="MZN">MZN – Metical Moçambicano</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Valor da Fatura</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          step="any"
                          className="form-control"
                          value={invoiceAmount}
                          onChange={e => setInvoiceAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Câmbio do Dia (MZN)</label>
                        <button
                          type="button"
                          onClick={handleFetchExchangeRate}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--blue-600)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Obter câmbio
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        value={exchangeRate}
                        onChange={e => setExchangeRate(e.target.value)}
                        required
                      />
                      <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                        Fonte: Banco de Moçambique
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Data do Pagamento</label>
                      <input
                        type="date"
                        className="form-control"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descrição (opcional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Consultoria técnica, licença cloud"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Important Legal Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--blue-50)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '24px'
                  }}
                >
                  <Info size={20} color="var(--blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>
                      Importante
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#1E40AF', marginTop: '2px', lineHeight: 1.4 }}>
                      Este simulador aplica as taxas padrão: <b>IVA (16%)</b> e <b>IRPC (20%)</b> sobre o <b>Contra-Valor (fator 1,25)</b> conforme a legislação tributária moçambicana vigente (Lei n.º 1/2018 e Lei n.º 34/2014).
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary-blue btn-lg">
                    <span>Calcular Impostos</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2 & 3: RESULTS & TECHNICAL PANELS (Matching Screenshot 2 - 03 Resultados) */}
          {currentStep >= 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Main Results Two-Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
                
                {/* LEFT: Resumo dos Cálculos Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                        Resumo dos Cálculos
                      </h3>
                      <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                        <CheckCircle2 size={13} />
                        <span>Cálculo concluído com sucesso</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Card 1: Valor em Meticais */}
                      <div
                        style={{
                          padding: '16px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--slate-50)',
                          border: '1px solid var(--slate-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--emerald-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={18} color="var(--emerald-600)" />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              Valor em Meticais
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                              Valor da fatura convertido para MZN ({invoiceAmount} {currency} × {exchangeRate})
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                          {formatMZN(calcResult.mznAmount)}
                        </span>
                      </div>

                      {/* Card 2: Contra Valor (Fator 1,25) */}
                      <div
                        style={{
                          padding: '16px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--slate-50)',
                          border: '1px solid var(--slate-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} color="var(--blue-600)" />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              Contra Valor (Fator 1,25)
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                              Base de incidência para cálculo dos impostos
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                          {formatMZN(calcResult.taxBase)}
                        </span>
                      </div>

                      {/* Card 3: IVA a Pagar (16%) */}
                      <div
                        style={{
                          padding: '16px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--slate-50)',
                          border: '1px solid var(--slate-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Percent size={18} color="#7E22CE" />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              IVA a Pagar (16%)
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                              Imposto sobre o Valor Acrescentado
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#7E22CE' }}>
                          {formatMZN(calcResult.ivaAmount)}
                        </span>
                      </div>

                      {/* Card 4: IRPC Retido na Fonte (20%) */}
                      <div
                        style={{
                          padding: '16px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--slate-50)',
                          border: '1px solid var(--slate-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--emerald-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase size={18} color="var(--emerald-600)" />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              IRPC Retido na Fonte (20%)
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                              Imposto sobre o Rendimento das Pessoas Colectivas
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--emerald-600)' }}>
                          {formatMZN(calcResult.irpcAmount)}
                        </span>
                      </div>

                      {/* Large Blue Highlight Card: Total de Impostos a Pagar */}
                      <div
                        style={{
                          padding: '20px 24px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                          border: '1.5px solid #2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px'
                        }}
                      >
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E3A8A' }}>
                            Total de Impostos a Pagar
                          </h3>
                          <p style={{ fontSize: '12px', color: '#1E40AF', marginTop: '2px' }}>
                            IVA (127.500,00 MZN) + IRPC (159.375,00 MZN)
                          </p>
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#1E3A8A' }}>
                          {formatMZN(calcResult.totalTax)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar Bottom */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        const rec = handleSaveCurrentSimulation();
                        openPDFPreview(rec);
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      <Printer size={16} />
                      <span>Gerar PDF</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      <FileSpreadsheet size={16} />
                      <span>Exportar Excel</span>
                    </button>

                    <button
                      onClick={handleSaveCurrentSimulation}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      <Save size={16} />
                      <span>Guardar Simulação</span>
                    </button>

                    <button
                      onClick={() => {
                        handleSaveCurrentSimulation();
                        addToast('success', 'Relatório Enviado', `Simulação enviada por e-mail para ${providerName}.`);
                      }}
                      className="btn btn-primary-blue"
                      style={{ flex: 1 }}
                    >
                      <Send size={16} />
                      <span>Enviar ao Cliente</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT: Assistente CLAQ AI Interactive Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    className="card"
                    style={{
                      padding: '24px',
                      background: 'linear-gradient(180deg, #0B132B 0%, #0F172A 100%)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(245, 158, 11, 0.25)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                        }}
                      >
                        <Bot size={24} color="#FFFFFF" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                          Assistente CLAQ AI
                        </h4>
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                          ✓ Análise concluída
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p>
                        Todos os cálculos estão em conformidade com a legislação tributária moçambicana vigente.
                      </p>

                      <div
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '10px',
                          padding: '12px 14px'
                        }}
                      >
                        <p style={{ color: '#FBBF24', fontWeight: 700, fontSize: '12.5px', marginBottom: '4px' }}>
                          ⚠️ Atenção à Convenção
                        </p>
                        <p style={{ color: '#E2E8F0', fontSize: '12px' }}>
                          Verifique se existe convenção de dupla tributação entre Moçambique e <b>{providerCountry}</b> para aplicação de taxa reduzida com Certificado de Residência Fiscal.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                      <button
                        onClick={() => openAIAssistantWithPrompt('Explique a memória de cálculo do Fator 1.25 e convenções com ' + providerCountry)}
                        className="btn btn-primary-gold"
                        style={{ width: '100%', fontSize: '13px', padding: '10px' }}
                      >
                        <Sparkles size={16} />
                        <span>Fazer Pergunta ao Assistente</span>
                      </button>

                      <button
                        onClick={() => openAIAssistantWithPrompt('Solicitar revisão e parecer técnico sobre esta fatura de ' + invoiceAmount + ' ' + currency)}
                        className="btn btn-ghost"
                        style={{ width: '100%', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', padding: '9px' }}
                      >
                        <span>Solicitar Revisão Técnica</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* TECHNICAL TABS: 04 Memória de Cálculo | 05 Base Legal | 06 Histórico */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--slate-200)', marginBottom: '20px' }}>
                  <button
                    onClick={() => setActiveTechnicalTab('trace')}
                    style={{
                      padding: '10px 18px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: activeTechnicalTab === 'trace' ? 'var(--blue-600)' : 'var(--slate-600)',
                      borderBottom: `2px solid ${activeTechnicalTab === 'trace' ? 'var(--blue-600)' : 'transparent'}`,
                      cursor: 'pointer'
                    }}
                  >
                    04 – Memória de Cálculo
                  </button>

                  <button
                    onClick={() => setActiveTechnicalTab('legal')}
                    style={{
                      padding: '10px 18px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: activeTechnicalTab === 'legal' ? 'var(--blue-600)' : 'var(--slate-600)',
                      borderBottom: `2px solid ${activeTechnicalTab === 'legal' ? 'var(--blue-600)' : 'transparent'}`,
                      cursor: 'pointer'
                    }}
                  >
                    05 – Base Legal
                  </button>

                  <button
                    onClick={() => setActiveTechnicalTab('history')}
                    style={{
                      padding: '10px 18px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: activeTechnicalTab === 'history' ? 'var(--blue-600)' : 'var(--slate-600)',
                      borderBottom: `2px solid ${activeTechnicalTab === 'history' ? 'var(--blue-600)' : 'transparent'}`,
                      cursor: 'pointer'
                    }}
                  >
                    06 – Histórico de Simulações ({simulations.length})
                  </button>
                </div>

                {/* 04 - Memória de Cálculo Flowchart Trace */}
                {activeTechnicalTab === 'trace' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)' }}>
                        Como os valores foram calculados
                      </h4>
                      <p style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>
                        Demonstração passo a passo da fórmula matemática conforme normas da Autoridade Tributária.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Step 1 */}
                      <div style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: '4px solid var(--blue-600)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--blue-600)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                            1
                          </div>
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              {calcResult.trace.step1.label}
                            </span>
                            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                              {calcResult.trace.step1.desc}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--slate-900)' }}>
                          {formatMZN(calcResult.trace.step1.value)}
                        </span>
                      </div>

                      {/* Step 2 */}
                      <div style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: '4px solid var(--gold-600)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--gold-600)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                            2
                          </div>
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              {calcResult.trace.step2.label}
                            </span>
                            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                              {calcResult.trace.step2.desc}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--slate-900)' }}>
                          {formatMZN(calcResult.trace.step2.value)}
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: '4px solid #7E22CE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#7E22CE', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                            3
                          </div>
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              {calcResult.trace.step3.label}
                            </span>
                            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                              {calcResult.trace.step3.desc}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#7E22CE' }}>
                          {formatMZN(calcResult.trace.step3.value)}
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: '4px solid var(--emerald-600)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--emerald-600)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                            4
                          </div>
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                              {calcResult.trace.step4.label}
                            </span>
                            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                              {calcResult.trace.step4.desc}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--emerald-600)' }}>
                          {formatMZN(calcResult.trace.step4.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 05 - Base Legal Tab */}
                {activeTechnicalTab === 'legal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      {(['iva', 'irpc', 'conventions', 'others'] as const).map(tabKey => (
                        <button
                          key={tabKey}
                          onClick={() => setLegalSubTab(tabKey)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: legalSubTab === tabKey ? 'var(--blue-600)' : 'var(--slate-200)',
                            backgroundColor: legalSubTab === tabKey ? 'var(--blue-50)' : '#FFFFFF',
                            color: legalSubTab === tabKey ? 'var(--blue-600)' : 'var(--slate-700)',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {tabKey === 'iva' ? 'Código do IVA' : tabKey === 'irpc' ? 'Código do IRPC' : tabKey === 'conventions' ? 'Convenções (CDT)' : 'Diplomas'}
                        </button>
                      ))}
                    </div>

                    <div style={{ backgroundColor: 'var(--slate-50)', padding: '20px', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                      {legalSubTab === 'iva' && (
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
                            Código do IVA (Lei n.º 32/2007 e Lei n.º 1/2018)
                          </h4>
                          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--slate-700)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li><b>Artigo 15 – Local das Prestações de Serviços:</b> Consideram-se localizadas em território moçambicano as prestações de serviços adquiridas por sujeitos passivos aqui residentes.</li>
                            <li><b>Artigo 17 – Prestações de Serviços a Não Residentes:</b> O adquirente residente é o sujeito passivo devedor do imposto através do mecanismo de autoliquidação na guia periódica Modelo A.</li>
                          </ul>
                        </div>
                      )}

                      {legalSubTab === 'irpc' && (
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
                            Código do IRPC (Lei n.º 34/2014)
                          </h4>
                          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--slate-700)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li><b>Artigo 65 – Retenções na Fonte:</b> Incidência de retenção na fonte sobre rendimentos pagos a entidades não residentes sem estabelecimento estável.</li>
                            <li><b>Artigo 66 – Taxas de Retenção:</b> Aplicação da taxa de 20% a título definitivo sobre pagamentos por serviços técnicos, gestão e consultoria.</li>
                          </ul>
                        </div>
                      )}

                      {legalSubTab === 'conventions' && (
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
                            Acordos de Dupla Tributação Ratificados por Moçambique
                          </h4>
                          <p style={{ fontSize: '13px', color: 'var(--slate-700)', lineHeight: 1.6 }}>
                            Portugal (10%), África do Sul (10%), Itália, Emirados Árabes Unidos, Índia, Macau, Maurícias e Botswana. Nota: Com os EUA não vigora acordo, aplicando-se 20%.
                          </p>
                        </div>
                      )}

                      {legalSubTab === 'others' && (
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
                            Diplomas Complementares e Circulares
                          </h4>
                          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--slate-700)', lineHeight: 1.6 }}>
                            <li>Regulamento do IVA – Decreto n.º 7/2020</li>
                            <li>Ofício Circular n.º 3012/AT/2021 (Aplicação do Gross-up factor 1,25)</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onNavigate('/biblioteca-legal')}
                        className="btn btn-ghost"
                        style={{ color: 'var(--blue-600)', fontSize: '13px' }}
                      >
                        <span>Ver Documentos Oficiais na Biblioteca Legal</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 06 - Histórico de Simulações Tab */}
                {activeTechnicalTab === 'history' && (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Simulador</th>
                          <th>Cliente / Prestador</th>
                          <th>Valor</th>
                          <th>Total Impostos</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulations.map(sim => (
                          <tr key={sim.id}>
                            <td style={{ fontWeight: 600 }}>{formatDate(sim.date)}</td>
                            <td>
                              <span className="badge badge-slate">{sim.simulatorTitle}</span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{sim.clientName}</td>
                            <td>{formatCurrency(sim.originalAmount, sim.currency)}</td>
                            <td style={{ fontWeight: 800, color: '#1E40AF' }}>{formatMZN(sim.totalTax)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => openPDFPreview(sim)}
                                  className="btn btn-ghost btn-sm"
                                  title="Ver Relatório PDF"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => deleteSimulation(sim.id)}
                                  className="btn btn-ghost btn-sm"
                                  title="Eliminar Registo"
                                  style={{ color: 'var(--red-500)' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* SALARY SIMULATOR VIEW (Laboral / RH) */}
      {activeSimulator === 'salary' && (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setActiveSimulator('catalog')}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--blue-600)' }}
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Simulador: Salário Líquido & Custo do Trabalhador
              </h2>
            </div>
          </div>

          {/* Salary inputs & live calculate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Salário Bruto (MZN)</label>
                <input
                  type="number"
                  className="form-control"
                  value={salaryGross}
                  onChange={e => setSalaryGross(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número de Dependentes</label>
                <input
                  type="number"
                  className="form-control"
                  value={salaryDeps}
                  onChange={e => setSalaryDeps(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subsídio de Transporte (Isento)</label>
                <input
                  type="number"
                  className="form-control"
                  value={salaryTransport}
                  onChange={e => setSalaryTransport(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subsídio de Alimentação (Isento)</label>
                <input
                  type="number"
                  className="form-control"
                  value={salaryFood}
                  onChange={e => setSalaryFood(e.target.value)}
                />
              </div>
            </div>

            {/* Calculated Salary Output */}
            {(() => {
              const res = calculateSalary({
                grossSalary: Number(salaryGross),
                dependents: Number(salaryDeps),
                transportAllowance: Number(salaryTransport),
                foodAllowance: Number(salaryFood)
              });
              return (
                <div style={{ backgroundColor: 'var(--slate-50)', padding: '24px', borderRadius: '14px', border: '1px solid var(--slate-200)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
                      Demonstração da Folha Salarial
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Salário Base Bruto:</span>
                        <span style={{ fontWeight: 700 }}>{formatMZN(res.grossSalary)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>INSS Trabalhador (3%):</span>
                        <span style={{ fontWeight: 700, color: 'var(--red-600)' }}>-{formatMZN(res.inssWorker)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Retenção IRPS (CIRPS 2026):</span>
                        <span style={{ fontWeight: 700, color: 'var(--red-600)' }}>-{formatMZN(res.irpsTax)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Total de Subsídios:</span>
                        <span style={{ fontWeight: 700, color: 'var(--emerald-600)' }}>+{formatMZN(res.totalAllowances)}</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: 'var(--slate-200)', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--blue-600)' }}>SALÁRIO LÍQUIDO DO TRABALHADOR:</span>
                        <span style={{ fontWeight: 900, color: 'var(--blue-600)' }}>{formatMZN(res.netSalary)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: 'var(--slate-600)' }}>INSS Patronal da Empresa (4%):</span>
                      <span style={{ fontWeight: 700 }}>{formatMZN(res.inssCompany)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px', fontWeight: 800, color: 'var(--slate-900)' }}>
                      <span>Custo Total para a Empresa:</span>
                      <span>{formatMZN(res.totalCompanyCost)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FINES SIMULATOR VIEW (Multas e Juros) */}
      {activeSimulator === 'fines' && (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setActiveSimulator('catalog')}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--blue-600)' }}
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Simulador: Juros de Mora e Multas Fiscais (Art. 101 LGT)
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Valor do Imposto em Atraso (MZN)</label>
                <input
                  type="number"
                  className="form-control"
                  value={fineAmount}
                  onChange={e => setFineAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dias de Atraso</label>
                <input
                  type="number"
                  className="form-control"
                  value={fineDays}
                  onChange={e => setFineDays(e.target.value)}
                />
              </div>
            </div>

            {(() => {
              const res = calculateFines({
                taxAmount: Number(fineAmount),
                daysLate: Number(fineDays),
                taxType: 'IVA'
              });
              return (
                <div style={{ backgroundColor: 'var(--red-50)', padding: '24px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--red-600)', marginBottom: '16px' }}>
                      Cálculo de Penalizações e Juros
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-700)' }}>Imposto Original:</span>
                        <span style={{ fontWeight: 700 }}>{formatMZN(res.taxAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-700)' }}>Multa Aplicada ({res.fineRate}%):</span>
                        <span style={{ fontWeight: 700, color: 'var(--red-600)' }}>+{formatMZN(res.fineAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-700)' }}>Juros de Mora ({res.daysLate} dias):</span>
                        <span style={{ fontWeight: 700, color: 'var(--red-600)' }}>+{formatMZN(res.interestAmount)}</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: 'rgba(239, 68, 68, 0.2)', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--red-600)' }}>TOTAL A PAGAR À AT:</span>
                        <span style={{ fontWeight: 900, color: 'var(--red-600)' }}>{formatMZN(res.totalToPay)}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: '#991B1B', marginTop: '16px' }}>
                    <b>Base Legal:</b> {res.legalArticle}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
