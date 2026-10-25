import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { PlanSelect } from './pages/PlanSelect';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { readAudience } from './lib/audience';
import type { Audience } from './types';
import { Calendario } from './pages/Calendario';
import { Relatorios } from './pages/Relatorios';
import { BibliotecaLegal } from './pages/BibliotecaLegal';
import { Clientes } from './pages/Clientes';
import { DataUpload } from './pages/DataUpload';
import { Configuracoes } from './pages/Configuracoes';
import { Alertas } from './pages/Alertas';
import { Newsletter } from './pages/Newsletter';
import { Suporte } from './pages/Suporte';
import { PaymentInstructions } from './pages/PaymentInstructions';

import { SimuladoresHub } from './pages/simuladores/SimuladoresHub';
import { PagamentoNaoResidentes } from './pages/simuladores/PagamentoNaoResidentes';
import { IvaOperacoes } from './pages/simuladores/IvaOperacoes';
import { IrpsRetencoes } from './pages/simuladores/IrpsRetencoes';
import { IrpcEstimativa } from './pages/simuladores/IrpcEstimativa';
import { InssContribuicoes } from './pages/simuladores/InssContribuicoes';
import { JurosMultas } from './pages/simuladores/JurosMultas';
import { ImpostoSelo } from './pages/simuladores/ImpostoSelo';
import { SalarioLiquido } from './pages/simuladores/SalarioLiquido';
import { HorasExtras } from './pages/simuladores/HorasExtras';
import { Ferias } from './pages/simuladores/Ferias';
import { Indemnizacao } from './pages/simuladores/Indemnizacao';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAppState();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname !== '/' && window.location.pathname !== ''
      ? window.location.pathname
      : '/dashboard';
  });

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const storedAudience = readAudience();

  const handleAudienceSelect = (_audience: Audience, _planCode: string | null) => {
    if (isAuthenticated) {
      localStorage.setItem('claq_payment_flow', 'upgrade');
      navigate('/pagamento');
    } else {
      localStorage.setItem('claq_payment_flow', 'signup');
      navigate('/criar-conta');
    }
  };

  if (currentPath === '/comecar/upgrade') {
    return <PlanSelect initialAudience="contabilidade" onSelect={handleAudienceSelect} />;
  }
  if (currentPath === '/comecar/upgrade-company') {
    return <PlanSelect initialAudience="empresa" onSelect={handleAudienceSelect} />;
  }

  // Pre-auth onboarding: choose the audience pillar before signing in
  if (currentPath === '/comecar') {
    return <PlanSelect onSelect={handleAudienceSelect} />;
  }

  if (currentPath === '/criar-conta') {
    return <Register onBack={() => navigate('/comecar')} onRegistrationComplete={() => navigate('/pagamento')} />;
  }

  if (currentPath === '/pagamento') {
    return (
      <PaymentInstructions
        onBack={() => navigate(localStorage.getItem('claq_payment_flow') === 'upgrade'
          ? (storedAudience === 'empresa' ? '/comecar/upgrade-company' : '/comecar/upgrade')
          : '/criar-conta')}
        onContinue={() => {
          const isUpgrade = localStorage.getItem('claq_payment_flow') === 'upgrade';
          localStorage.removeItem('claq_payment_flow');
          navigate(isUpgrade && isAuthenticated ? '/dashboard' : '/login');
        }}
      />
    );
  }

  // If not authenticated or explicitly at /login, render Login view
  if (!isAuthenticated || currentPath === '/login') {
    // First-time visitors without a stored audience go through the pillar selector
    if (!isAuthenticated && !storedAudience && currentPath !== '/login') {
      return <PlanSelect onSelect={handleAudienceSelect} />;
    }
    return (
      <Login
        audience={storedAudience ?? undefined}
        onBack={() => navigate('/comecar')}
        onCreateAccount={() => navigate('/comecar')}
        onLoginSuccess={() => navigate('/dashboard')}
      />
    );
  }

  const renderCurrentPage = () => {
    if (currentPath === '/dashboard') return <Dashboard onNavigate={navigate} />;
    if (currentPath === '/calendario') return <Calendario onNavigate={navigate} />;
    if (currentPath === '/simuladores') return <SimuladoresHub onNavigate={navigate} />;
    if (currentPath === '/simuladores/pagamento-nao-residentes') return <PagamentoNaoResidentes onNavigate={navigate} />;
    if (currentPath === '/simuladores/iva-operacoes') return <IvaOperacoes onNavigate={navigate} />;
    if (currentPath === '/simuladores/irps-retencoes') return <IrpsRetencoes onNavigate={navigate} />;
    if (currentPath === '/simuladores/irpc-estimativa') return <IrpcEstimativa onNavigate={navigate} />;
    if (currentPath === '/simuladores/inss-contribuicoes') return <InssContribuicoes onNavigate={navigate} />;
    if (currentPath === '/simuladores/juros-multas') return <JurosMultas onNavigate={navigate} />;
    if (currentPath === '/simuladores/imposto-selo') return <ImpostoSelo onNavigate={navigate} />;
    if (currentPath === '/simuladores/salario-liquido') return <SalarioLiquido onNavigate={navigate} />;
    if (currentPath === '/simuladores/horas-extras') return <HorasExtras onNavigate={navigate} />;
    if (currentPath === '/simuladores/ferias') return <Ferias onNavigate={navigate} />;
    if (currentPath === '/simuladores/indemnizacao') return <Indemnizacao onNavigate={navigate} />;
    if (currentPath === '/relatorios') return <Relatorios onNavigate={navigate} />;
    if (currentPath.startsWith('/biblioteca-legal')) return <BibliotecaLegal />;
    if (currentPath === '/clientes') return <Clientes onNavigate={navigate} />;
    if (currentPath === '/dados') return <DataUpload />;
    if (currentPath === '/configuracoes') return <Configuracoes onNavigate={navigate} />;
    if (currentPath === '/alertas') return <Alertas onNavigate={navigate} />;
    if (currentPath === '/newsletter') return <Newsletter />;
    if (currentPath === '/suporte') return <Suporte />;
    return <Dashboard onNavigate={navigate} />;
  };

  return (
    <Layout currentPath={currentPath} onNavigate={navigate}>
      {renderCurrentPage()}
    </Layout>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </QueryClientProvider>
  );
};

export default App;
