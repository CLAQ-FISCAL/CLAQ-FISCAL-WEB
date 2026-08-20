import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Calendario } from './pages/Calendario';
import { Simuladores } from './pages/Simuladores';
import { Relatorios } from './pages/Relatorios';
import { BibliotecaLegal } from './pages/BibliotecaLegal';
import { Clientes } from './pages/Clientes';
import { Configuracoes } from './pages/Configuracoes';
import { Alertas } from './pages/Alertas';
import { Newsletter } from './pages/Newsletter';
import { Suporte } from './pages/Suporte';

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

  // If not authenticated or explicitly at /login, render Login view
  if (!isAuthenticated || currentPath === '/login') {
    return <Login onLoginSuccess={() => navigate('/dashboard')} />;
  }

  const renderCurrentPage = () => {
    if (currentPath === '/dashboard') return <Dashboard onNavigate={navigate} />;
    if (currentPath === '/calendario') return <Calendario onNavigate={navigate} />;
    if (currentPath.startsWith('/simuladores')) return <Simuladores onNavigate={navigate} />;
    if (currentPath === '/relatorios') return <Relatorios onNavigate={navigate} />;
    if (currentPath.startsWith('/biblioteca-legal')) return <BibliotecaLegal />;
    if (currentPath === '/clientes') return <Clientes onNavigate={navigate} />;
    if (currentPath === '/configuracoes') return <Configuracoes />;
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
