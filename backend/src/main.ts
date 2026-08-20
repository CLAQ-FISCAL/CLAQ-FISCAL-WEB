import http from 'http';
import { TaxEngineService } from './taxEngine';

const PORT = process.env.PORT || 4000;

// In-Memory dynamic DB Store initialized with seed entities
const DB = {
  company: {
    id: 'comp_claq_001',
    legalName: 'CLAQ Consultores, Lda',
    nuit: '400889900',
    planTier: 'PME',
    city: 'Maputo',
    province: 'Maputo Cidade',
    fiscalAddress: 'Av. 24 de Julho, Edifício Platinum, 5º Andar'
  },
  user: {
    id: 'usr_carlos_apollo',
    name: 'Carlos Apollo',
    email: 'carlos.apollo@claq.co.mz',
    phone: '+258 84 123 4567',
    role: 'Contabilista / Administrador',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    companyName: 'CLAQ Consultores, Lda',
    companyNuit: '400889900',
    plan: 'PME',
    renewalDate: '15/12/2026'
  },
  obligations: [
    {
      id: 'obl-iva-jun26',
      title: 'IVA – Declaração e Pagamento',
      category: 'IVA',
      period: 'Junho/2026',
      dueDate: '2026-06-30',
      status: 'a_vencer',
      amount: 127500,
      authority: 'AT',
      description: 'Declaração periódica do Modelo A e guia de pagamento do IVA relativo às operações de Junho.',
      penaltyRisk: 'Multa de 25% a 100% mais juros de mora legais (Art. 101 LGT).',
      daysRemaining: 3
    },
    {
      id: 'obl-inss-jun26',
      title: 'INSS – Contribuição Mensal',
      category: 'INSS',
      period: 'Junho/2026',
      dueDate: '2026-07-10',
      status: 'a_vencer',
      amount: 45230,
      authority: 'INSS',
      description: 'Folha de salários e pagamento de 3% trabalhador + 4% patronal.',
      penaltyRisk: 'Juros de mora mensais e certidão de quitação bloqueada.',
      daysRemaining: 8
    },
    {
      id: 'obl-tae-2026',
      title: 'TAE – Taxa de Atividade Económica',
      category: 'TAE',
      period: '1º Semestre/2026',
      dueDate: '2026-07-20',
      status: 'pendente',
      amount: 12000,
      authority: 'Municipio',
      description: 'Obrigação municipal. Consulte a tabela do seu município (Conselho Municipal de Maputo).',
      penaltyRisk: 'Agravamento de 50% por incumprimento do prazo municipal.',
      daysRemaining: 20
    },
    {
      id: 'obl-alvara-2026',
      title: 'Alvará Comercial',
      category: 'Alvara',
      period: 'Renovação Anual 2026',
      dueDate: '2026-08-15',
      status: 'a_renovar',
      amount: 8500,
      authority: 'BAU',
      description: 'Renove o seu alvará para evitar penalizações e encerramento preventivo.',
      penaltyRisk: 'Suspensão da licença de exercício comercial.',
      daysRemaining: 45
    }
  ],
  simulations: [
    {
      id: 'sim-001',
      simulatorId: 'pagamento-nao-residentes',
      simulatorTitle: 'Pagamento ao Exterior',
      date: '2026-07-15',
      clientName: 'Google LLC',
      nuit: '400998822',
      currency: 'USD',
      originalAmount: 10000,
      exchangeRate: 63.75,
      mznAmount: 637500,
      factor: 1.25,
      taxBase: 796875,
      ivaAmount: 127500,
      ivaRate: 16,
      irpcAmount: 159375,
      irpcRate: 20,
      totalTax: 286875,
      description: 'Serviços de infraestrutura cloud e licenças de software corporativo',
      providerCountry: 'Estados Unidos',
      status: 'concluido',
      responsibleName: 'Carlos Apollo',
      createdAt: new Date().toISOString()
    }
  ],
  clients: [
    {
      id: 'cli-1',
      name: 'ABC Comércio, Lda',
      nuit: '400123456',
      plan: 'PME',
      status: 'regular',
      nextObligation: 'IVA – 30/06/2026',
      contactEmail: 'geral@abccomercio.co.mz',
      contactPhone: '+258 84 555 1234',
      activitySector: 'Comércio Geral & Distribuição',
      city: 'Maputo'
    },
    {
      id: 'cli-2',
      name: 'XPTO Serviços, Lda',
      nuit: '500984321',
      plan: 'PME',
      status: 'alerta',
      nextObligation: 'INSS – 10/07/2026',
      contactEmail: 'admin@xpto.co.mz',
      contactPhone: '+258 82 444 9876',
      activitySector: 'Consultoria e TI',
      city: 'Matola'
    }
  ],
  alerts: [
    {
      id: 'alt-1',
      title: 'IVA – Junho/2026',
      message: 'Não deixe para a última hora. Evite multas e juros de mora.',
      severity: 'critical',
      category: 'IVA',
      dueDate: '30/06/2026',
      daysRemaining: 3,
      read: false
    }
  ],
  exchangeRates: {
    USD: 63.75,
    EUR: 69.40,
    ZAR: 3.52,
    GBP: 81.20,
    MZN: 1.00,
    lastUpdated: new Date().toISOString(),
    source: 'Banco de Moçambique'
  }
};

// Request Parser Helper
const parseJsonBody = (req: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
};

const sendJson = (res: http.ServerResponse, statusCode: number, data: any) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Id'
  });
  res.end(JSON.stringify(data));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Id'
    });
    return res.end();
  }

  try {
    // -------------------------------------------------------------
    // Health & Ping Endpoints
    // -------------------------------------------------------------
    if (pathname === '/healthz' || pathname === '/api/v1/health') {
      return sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString(), version: '2.0.0' });
    }

    // -------------------------------------------------------------
    // Auth Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/auth/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const token = `claq_jwt_${Buffer.from(JSON.stringify({ userId: DB.user.id, email: body.email })).toString('base64')}`;
      return sendJson(res, 200, {
        success: true,
        token,
        user: DB.user,
        company: DB.company
      });
    }

    if (pathname === '/api/v1/auth/me' && method === 'GET') {
      return sendJson(res, 200, { user: DB.user, company: DB.company });
    }

    // -------------------------------------------------------------
    // Fiscal Obligations Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/obligations' && method === 'GET') {
      const category = url.searchParams.get('category');
      const authority = url.searchParams.get('authority');

      let filtered = DB.obligations;
      if (category && category !== 'all') filtered = filtered.filter(o => o.category === category);
      if (authority && authority !== 'all') filtered = filtered.filter(o => o.authority === authority);

      return sendJson(res, 200, { data: filtered, total: filtered.length });
    }

    if (pathname === '/api/v1/obligations' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newObl = {
        id: `obl-${Date.now()}`,
        title: body.title,
        category: body.category || 'IVA',
        period: body.period || 'Junho/2026',
        dueDate: body.dueDate || '2026-06-30',
        status: 'a_vencer',
        amount: Number(body.amount) || 0,
        authority: body.authority || 'AT',
        description: body.description || '',
        penaltyRisk: body.penaltyRisk || 'Multa legal aplicável.',
        daysRemaining: 10
      };
      DB.obligations.unshift(newObl);
      return sendJson(res, 201, { success: true, data: newObl });
    }

    if (pathname.startsWith('/api/v1/obligations/') && pathname.endsWith('/settle') && method === 'PATCH') {
      const id = pathname.split('/')[4];
      const obl = DB.obligations.find(o => o.id === id);
      if (obl) {
        obl.status = 'pago';
        return sendJson(res, 200, { success: true, message: 'Obrigação liquidada com sucesso.', data: obl });
      }
      return sendJson(res, 404, { error: 'Obrigação não encontrada' });
    }

    // -------------------------------------------------------------
    // Tax Simulations & Engine Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/simulations/calculate' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = TaxEngineService.calculateNonResidentService({
        providerName: body.providerName || 'Google LLC',
        providerCountry: body.providerCountry || 'Estados Unidos',
        currency: body.currency || 'USD',
        invoiceAmount: Number(body.invoiceAmount) || 10000,
        exchangeRate: Number(body.exchangeRate) || 63.75,
        paymentDate: body.paymentDate || '2026-07-15',
        description: body.description,
        clientNuit: DB.company.nuit
      });
      return sendJson(res, 200, { success: true, calculation: result });
    }

    if (pathname === '/api/v1/simulations' && method === 'GET') {
      return sendJson(res, 200, { data: DB.simulations, count: DB.simulations.length });
    }

    if (pathname === '/api/v1/simulations' && method === 'POST') {
      const body = await parseJsonBody(req);
      const calc = TaxEngineService.calculateNonResidentService(body);
      const newSim = {
        id: `sim-${Date.now().toString().slice(-4)}`,
        simulatorId: 'pagamento-nao-residentes',
        simulatorTitle: 'Pagamento de Serviços a Não Residentes',
        date: body.paymentDate || '2026-07-15',
        clientName: body.providerName || 'Google LLC',
        nuit: body.clientNuit || '400998822',
        currency: body.currency || 'USD',
        originalAmount: Number(body.invoiceAmount) || 10000,
        exchangeRate: Number(body.exchangeRate) || 63.75,
        mznAmount: calc.mznAmount,
        factor: calc.grossUpFactor,
        taxBase: calc.taxBase,
        ivaAmount: calc.ivaAmount,
        ivaRate: calc.ivaRate * 100,
        irpcAmount: calc.irpcAmount,
        irpcRate: calc.irpcRate * 100,
        totalTax: calc.totalTax,
        digitalSealHash: calc.digitalSealHash,
        description: body.description || 'Simulação tributária',
        providerCountry: body.providerCountry || 'Estados Unidos',
        status: 'concluido',
        responsibleName: DB.user.name,
        createdAt: new Date().toISOString()
      };
      DB.simulations.unshift(newSim);
      return sendJson(res, 201, { success: true, data: newSim });
    }

    if (pathname.startsWith('/api/v1/simulations/') && method === 'DELETE') {
      const id = pathname.split('/')[4];
      DB.simulations = DB.simulations.filter(s => s.id !== id);
      return sendJson(res, 200, { success: true, message: 'Simulação eliminada com sucesso.' });
    }

    // -------------------------------------------------------------
    // Clients Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/clients' && method === 'GET') {
      return sendJson(res, 200, { data: DB.clients, count: DB.clients.length });
    }

    if (pathname === '/api/v1/clients' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newClient = {
        id: `cli-${Date.now()}`,
        name: body.name,
        nuit: body.nuit,
        plan: body.plan || 'PME',
        status: body.status || 'regular',
        nextObligation: body.nextObligation || 'IVA – 30/06/2026',
        contactEmail: body.contactEmail || '',
        contactPhone: body.contactPhone || '+258 84 ',
        activitySector: body.activitySector || 'Comércio Geral',
        city: body.city || 'Maputo'
      };
      DB.clients.push(newClient);
      return sendJson(res, 201, { success: true, data: newClient });
    }

    if (pathname.startsWith('/api/v1/clients/') && method === 'DELETE') {
      const id = pathname.split('/')[4];
      DB.clients = DB.clients.filter(c => c.id !== id);
      return sendJson(res, 200, { success: true, message: 'Cliente removido com sucesso.' });
    }

    // -------------------------------------------------------------
    // Alerts & Notifications Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/v1/alerts' && method === 'GET') {
      return sendJson(res, 200, { data: DB.alerts, unreadCount: DB.alerts.filter(a => !a.read).length });
    }

    if (pathname === '/api/v1/alerts/mark-read' && method === 'PATCH') {
      DB.alerts.forEach(a => { a.read = true; });
      return sendJson(res, 200, { success: true, message: 'Todos os alertas marcados como lidos.' });
    }

    // -------------------------------------------------------------
    // Exchange Rates Live Endpoint
    // -------------------------------------------------------------
    if (pathname === '/api/v1/exchange-rates/latest' && method === 'GET') {
      return sendJson(res, 200, { success: true, rates: DB.exchangeRates });
    }

    // -------------------------------------------------------------
    // AI Tax Intelligence RAG Endpoint
    // -------------------------------------------------------------
    if (pathname === '/api/v1/ai/chat' && method === 'POST') {
      const body = await parseJsonBody(req);
      const query = (body.prompt || '').toLowerCase();

      let answer = 'De acordo com a legislação tributária de Moçambique, todas as transacções internacionais com prestadores não residentes sujeitam-se à retenção na fonte de 20% de IRPC e 16% de IVA sobre o contra-valor (fator 1,25).';
      if (query.includes('1.25') || query.includes('fator') || query.includes('gross-up')) {
        answer = 'O fator 1,25 (gross-up) decorre da aplicação da fórmula Base = Valor / (1 - 0.20) conforme o Ofício Circular n.º 3012/AT/2021 em contratos líquidos de impostos.';
      } else if (query.includes('convenção') || query.includes('dta') || query.includes('portugal') || query.includes('áfrica do sul')) {
        answer = 'Moçambique possui acordos de dupla tributação ratificados com Portugal (10%), África do Sul (10%), Itália, EAU, Índia, Macau, Maurícias e Botswana.';
      }

      return sendJson(res, 200, {
        success: true,
        answer,
        legalCitations: ['Lei n.º 1/2018 (CIVA)', 'Lei n.º 34/2014 (CIRPC)', 'Ofício Circular n.º 3012/AT/2021']
      });
    }

    // 404 Fallback
    return sendJson(res, 404, { error: 'Rota não encontrada', path: pathname });

  } catch (err: any) {
    console.error('Server error:', err);
    return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CLAQ Fiscal Alert Production API running on http://127.0.0.1:${PORT}`);
});
