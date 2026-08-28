# 📘 CLAQ Fiscal Alert – Master Architecture & Exhaustive Mock/Hardcoded Data Audit

---

## 1. Executive Summary & Purpose
This document provides a comprehensive, file-by-file, component-by-component audit of every single mock, seed, and hardcoded value across the **CLAQ Fiscal Alert** codebase (`frontend/` and `backend/`).

### Primary Objectives:
1. Identify **every hardcoded string, mock array, static calculation, placeholder number, and demo profile**.
2. Document **why each value should not be hardcoded in production**.
3. Specify the **exact dynamic database table, REST API endpoint, or user-input mechanism** required to replace each hardcoded item.

---

## 2. Global Inventory of Seed Files & Central Mock Stores

### File: `frontend/src/data/initialData.ts`
This is the main fallback seed file used when the browser runs without a connected database session.

| Object / Array | Exact Hardcoded Contents | Why It Shouldn't Be Hardcoded | Dynamic Production Replacement |
| :--- | :--- | :--- | :--- |
| **`INITIAL_USER`** (Lines 12–27) | `id: 'usr_carlos_apollo'`, `name: 'Carlos Apollo'`, `email: 'carlos.apollo@claq.co.mz'`, `companyName: 'CLAQ Consultores, Lda'`, `companyNuit: '400889900'`, `plan: 'PME'` | Each user must have their own dynamic corporate identity from authentication. | `GET /api/v1/auth/me` linked to `users` and `companies` tables in PostgreSQL. |
| **`INITIAL_SETTINGS`** (Lines 29–48) | `whatsapp: true`, `alertTiming: { d7: true, d3: true, d1: true }`, `whatsappNumber: '+258 84 123 4567'` | Each user configures their own phone and alert intervals. | `GET /api/v1/user/notifications` linked to `notification_preferences` table. |
| **`INITIAL_OBLIGATIONS`** (Lines 50–140) | 8 static duties (`obl-iva-jun26`, `obl-inss-jun26`, `obl-tae-2026`, `obl-alvara-2026`, `obl-irps-jun26`, `obl-irpc-m22`) with fixed amounts (`127500`, `45230`, `185000`) | Tax obligations vary by company revenue, fiscal regime, and invoice volumes. | `GET /api/v1/obligations` linked to `fiscal_obligations` table populated by user invoice ingestion. |
| **`INITIAL_ALERTS`** (Lines 142–185) | 4 static alerts (`alt-1`, `alt-2`, `alt-3`, `alt-4`) with fixed countdowns (3 days, 8 days, 20 days) | Alerts must be generated dynamically based on $T-7, T-3, T-1, T-0$ from real obligation due dates. | `GET /api/v1/alerts` generated dynamically by the backend `AlertSchedulerWorker`. |
| **`INITIAL_NEWS`** (Lines 187–235) | 4 static news items ("Alteração ao Regulamento do IVA", "Novo prazo Modelo 22", "Comunicado INSS") | Fiscal news and gazettes change weekly. | `GET /api/v1/news` from CMS / `news_articles` table. |
| **`INITIAL_CLIENTS`** (Lines 237–285) | 5 mock clients (`ABC Comércio`, `XPTO Serviços`, `Construções Forte`, `Mercado Digital`, `Logística Lda`) | Accounting firms must manage their own real client portfolio. | `GET /api/v1/clients` linked to `clients` table scoped by `tenant_id`. |
| **`INITIAL_LEGAL_DOCS`** (Lines 287–335) | CIVA Lei 25/2007, Regulamento Dec 7/2020, CIRPS Lei 33/2007, CIRPC Lei 34/2014, LGT Lei 15/2002 | While the laws are real, articles should be dynamically searchable via vector database. | `GET /api/v1/legal-library` linked to `legal_documents` & `legal_articles` with `pgvector`. |
| **`INITIAL_SIMULATIONS`** (Lines 337–420) | 5 mock simulation runs (`Google LLC`, `ABC Comércio`, `XYZ Lda`, `Empresa Exemplo`, `Empresa Teste`) | History should only contain simulations executed by the logged-in accountant. | `GET /api/v1/simulations` linked to `tax_simulations` table. |

---

### File: `frontend/src/data/taxEngine.ts`

| Hardcoded Item | Location | Why It Shouldn't Be Hardcoded | Dynamic Production Replacement |
| :--- | :--- | :--- | :--- |
| **`MOCK_EXCHANGE_RATES`** | Lines 12–18 (`USD: 63.75`, `EUR: 69.40`, `ZAR: 3.52`, `GBP: 81.20`) | Currency exchange rates fluctuate daily on financial markets. | Daily scheduled cron scraping official Banco de Moçambique rates stored in `exchange_rate_cache`. |
| **MIMO Interest Benchmark Rate** | Lines 140–150 (`17.25% + 2% margin`) | The Banco de Moçambique Monetary Policy Committee (CPMO) updates the MIMO rate periodically. | Central Bank Policy API / Admin Settings table. |

---

## 3. Page-by-Page Exhaustive Hardcoded Values Audit

---

### 1. Auth & Login Page (`frontend/src/pages/Login.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Demo Login Credentials** | Lines 30–35 | `emailOrNuit = 'carlos.apollo@claq.co.mz'`, `password = 'senha123456'` | Remove pre-filled credentials in production. Form should be empty and validate user inputs. |
| **Testimonial Quote** | Lines 85–95 | `"Mais organização, menos multas, mais crescimento para o seu negócio." – CLAQ Consultores` | Dynamic marketing quote from CMS or customer reviews database. |
| **Security Badges** | Lines 120–135 | `Dados protegidos`, `100% Moçambique`, `Suporte dedicado` | Localized trust badges verified by ISO / AT certifications. |

---

### 2. Executive Dashboard (`frontend/src/pages/Dashboard.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **User Greeting** | Line 92 | `Olá, Carlos Apollo! 👋` | Dynamic name: `Olá, ${user.fullName}! 👋` |
| **Current Month Banner** | Line 95 | `...obrigações fiscais, laborais e alertas para Junho de 2026.` | Dynamic current month: `new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(new Date())` |
| **KPI Card 1: Próxima Obrigação** | Lines 110–130 | Fixed to `30/06/2026` | Computed on the fly from the earliest pending obligation in `obligations`. |
| **KPI Card 2: INSS** | Lines 135–155 | Fixed to `10/07/2026` and `45 230,00 MZN` | Computed from actual company payroll sheet. |
| **KPI Card 3: Licenças** | Lines 160–180 | Fixed to `2 a renovar` | Count of registered municipal duties (`TAE`, `Alvará`) expiring within 60 days. |
| **Compliance Gauge** | Lines 410–445 | Fixed to `85%` (12 Em dia, 3 A vencer, 0 Vencidas, 2 A renovar) | Dynamically calculated: $\text{Compliance} = \frac{\text{Paid Obligations}}{\text{Total Registered}} \times 100\%$. |
| **Quick Simulator Cards** | Lines 78–85 | 6 hardcoded cards (IVA, IRPS, INSS, Salário, Multas, Custo) | Fetched from `/api/v1/simulators/catalog`. |

---

### 3. Calendário Fiscal (`frontend/src/pages/Calendario.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Month Header** | Line 34 | `Junho 2026` | Real-time month engine with navigation (`monthOffset`). |
| **Default Due Date** | Line 43 | `2026-06-30` | Defaults to the last day of the currently viewed month. |
| **Default Amount** | Line 44 | `50000` | Empty input requiring user to type the invoice or estimated tax amount. |
| **Category Options** | Lines 300–315 | Hardcoded dropdown (`IVA`, `INSS`, `IRPS`, `IRPC`, `TAE`, `Alvara`) | Fetched from database enumeration `ObligationCategory`. |
| **Authority Options** | Lines 320–330 | Hardcoded dropdown (`AT`, `INSS`, `Municipio`, `BAU`) | Fetched from database enumeration `TaxAuthority`. |

---

### 4. Centro de Simuladores (`frontend/src/pages/Simuladores.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Default Provider Name** | Line 68 | `Google LLC` | Empty input for user to type vendor name. |
| **Default Country** | Line 69 | `Estados Unidos` | Dropdown of ISO countries with DTA indicators (e.g. Portugal, South Africa, UAE). |
| **Default Currency & Amount** | Lines 70–72 | `USD`, `10000`, `63.75` | User inputs actual invoice amount and currency. |
| **Default Payment Date** | Line 73 | `2026-07-15` | Default to `today` (`new Date().toISOString().split('T')[0]`). |
| **Default Description** | Line 74 | `Serviços de infraestrutura cloud e licenças de software corporativo` | Optional text field for accountant invoice memo. |
| **Salary Defaults** | Lines 94–97 | `salaryGross: 120000`, `deps: 2`, `transport: 5000`, `food: 5000` | Inputs for HR / payroll team. |
| **IVA Defaults** | Lines 100–101 | `sales: 850000`, `purchases: 320000` | Inputs for monthly sales/purchases apuramento. |
| **Fines Defaults** | Lines 104–105 | `amount: 127500`, `days: 45` | Inputs for overdue tax settlement. |
| **Legal Citations Panel** | Lines 1200–1260 | Hardcoded static article snippets (Art. 15 CIVA, Art. 66 CIRPC) | Dynamic legal citations fetched from `/api/v1/legal-library`. |

---

### 5. Relatórios Financeiros (`frontend/src/pages/Relatorios.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Date Range Label** | Line 24 | `01/01/2026 – 30/06/2026` | Dynamic date range picker (Last 30 Days, Q1, Q2, Full Year). |
| **Taxes Paid Summary** | Lines 40–44 | Static `128 450,00 MZN` | Sum of `amount` for all `status === 'pago'` and `category in ['IVA', 'IRPC', 'IRPS']`. |
| **INSS Paid Summary** | Lines 41–44 | Static `45 230,00 MZN` | Sum of `amount` for all `status === 'pago'` and `category === 'INSS'`. |
| **Municipal Fees Summary** | Lines 42–44 | Static `12 000,00 MZN` | Sum of `amount` for all `status === 'pago'` and `category in ['TAE', 'Alvara']`. |
| **Total Paid** | Lines 43–44 | Static `185 680,00 MZN` | Exact mathematical sum: $\text{Taxes} + \text{INSS} + \text{Municipal}$. |

---

### 6. Biblioteca Legal (`frontend/src/pages/BibliotecaLegal.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Category Count Badges** | Lines 40–50 | `Todos: 258`, `Leis: 34`, `Decretos: 58`, `Regulamentos: 32`, `Diplomas: 28`, `Outros: 106` | SQL Count: `SELECT doc_type, COUNT(*) FROM legal_documents GROUP BY doc_type`. |
| **Document Summaries** | Lines 120–200 | Pre-written summaries of CIVA, CIRPS, CIRPC, LGT | Dynamic database records stored in `legal_documents` table with full text indexed for search. |

---

### 7. Gestão de Clientes (`frontend/src/pages/Clientes.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Default Sector** | Line 35 | `Comércio Geral & Distribuição` | Dropdown of Mozambican CAE (Classificação das Actividades Económicas) codes. |
| **Default City** | Line 36 | `Maputo` | Dynamic dropdown of Mozambican provinces and cities. |
| **Client Status Badges** | Lines 140–180 | Static statuses (`regular`, `alerta`, `critico`) | Computed dynamically based on whether client has overdue obligations. |

---

### 8. Configurações & Perfil (`frontend/src/pages/Configuracoes.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Subscription Plan Card** | Lines 210–240 | `CLAQ Fiscal Alert Pro PME`, Renova a `15/12/2026` | Read from `companies.plan_tier` and `companies.plan_renews_at`. |
| **Integration Status Cards** | Lines 260–310 | Static cards for WhatsApp Business API, e-Tributação AT, Primavera ERP | Read from `company_integrations` table storing OAuth tokens and API connection status. |

---

### 9. Ajuda & Suporte (`frontend/src/pages/Suporte.tsx`)

| Element | Location | Hardcoded Value | Dynamic Production Requirement |
| :--- | :--- | :--- | :--- |
| **Office Address** | Line 68 | `Av. 24 de Julho, Edifício Platinum, 5º Andar, Maputo` | Company physical headquarters address from CMS / settings. |
| **Phone Number** | Line 53 | `+258 84 123 4567` | Official support desk WhatsApp number. |
| **Tax FAQ Accordion** | Lines 22–45 | 4 pre-written Q&As (IVA prazos, Não Residentes 20%, INSS 10th, Art. 101 LGT multas) | Dynamic knowledge base table `support_faqs` manageable via Admin Portal. |

---

### 10. Modals & Interactive Components

#### WhatsApp Modal (`frontend/src/components/whatsapp/WhatsAppModal.tsx`)
- **Hardcoded**: Test phone `+258 84 123 4567` and message template dropdown options.
- **Dynamic Fix**: Reads user's actual phone number from `notification_preferences.whatsapp_phone` and calls `POST /api/v1/notifications/whatsapp/test`.

#### PDF Preview Modal (`frontend/src/components/simulators/PDFPreviewModal.tsx`)
- **Hardcoded**: Static header `CLAQ Consultores, Lda.`, NUIT `400889900`, fixed hash `SHA256-CLAQ-SIM-001`.
- **Dynamic Fix**: Backend Puppeteer service renders the certificate with the actual logged-in company's name, NUIT, and authentic HMAC-SHA256 cryptographic seal.

#### Checkout Modal (`frontend/src/components/payments/CheckoutModal.tsx`)
- **Hardcoded**: Entidade `99001`, Referência `400 889 900`, Bank Account NIBs for Millennium BIM, BCI, and Standard Bank.
- **Dynamic Fix**: Calls `POST /api/v1/payments/bank-transfer/reference` to generate a dynamic 9-digit payment reference tied to the user's billing invoice.

---

## 4. Backend Mock Inventory (`backend/src/main.ts`)

| Mock Object | Location | Why It Should Not Be In-Memory | Production Fix |
| :--- | :--- | :--- | :--- |
| **`DB.company`** | Lines 7–16 | Static in-memory JS object | PostgreSQL `companies` table queried with `company_id`. |
| **`DB.user`** | Lines 17–30 | Static user record for Carlos Apollo | PostgreSQL `users` table with JWT authentication. |
| **`DB.obligations`** | Lines 31–75 | In-memory array of 4 obligations | PostgreSQL `fiscal_obligations` table. |
| **`DB.simulations`** | Lines 76–105 | In-memory array of past simulations | PostgreSQL `tax_simulations` table. |
| **`DB.clients`** | Lines 106–135 | In-memory array of 2 clients | PostgreSQL `clients` table. |
| **`DB.alerts`** | Lines 136–150 | In-memory array of 1 alert | PostgreSQL `alerts` table generated dynamically by cron. |
| **`DB.exchangeRates`** | Lines 151–160 | Hardcoded currency rates (63.75, 69.40, 3.52) | Daily cron scraping Banco de Moçambique feed. |

---

## 5. Master Transition Blueprint: Database Schemas to Replace All Mocks

```sql
-- 1. Companies / Tenants (Replaces INITIAL_USER company fields & DB.company)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name VARCHAR(255) NOT NULL,
  nuit VARCHAR(9) UNIQUE NOT NULL,
  plan_tier VARCHAR(50) DEFAULT 'PME',
  plan_status VARCHAR(50) DEFAULT 'active',
  plan_renews_at TIMESTAMP,
  province VARCHAR(100) DEFAULT 'Maputo Cidade',
  city VARCHAR(100) DEFAULT 'Maputo',
  fiscal_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Replaces INITIAL_USER & DB.user)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'ACCOUNTING_ADMIN',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fiscal Obligations (Replaces INITIAL_OBLIGATIONS & DB.obligations)
CREATE TABLE fiscal_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- IVA, INSS, IRPS, IRPC, TAE, ALVARA
  reference_period VARCHAR(50) NOT NULL,
  due_date DATE NOT NULL,
  estimated_amount DECIMAL(18,2) NOT NULL,
  settled_amount DECIMAL(18,2),
  status VARCHAR(50) DEFAULT 'a_vencer', -- a_vencer, pago, pendente, vencido
  authority VARCHAR(50) DEFAULT 'AT',
  payment_reference VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tax Simulations (Replaces INITIAL_SIMULATIONS & DB.simulations)
CREATE TABLE tax_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  simulator_type VARCHAR(100) NOT NULL,
  simulator_title VARCHAR(255) NOT NULL,
  counterparty_name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  original_amount DECIMAL(18,2) NOT NULL,
  exchange_rate DECIMAL(12,4) NOT NULL,
  mzn_amount DECIMAL(18,2) NOT NULL,
  gross_up_factor DECIMAL(6,4) DEFAULT 1.25,
  tax_base DECIMAL(18,2) NOT NULL,
  iva_amount DECIMAL(18,2) NOT NULL,
  irpc_amount DECIMAL(18,2) NOT NULL,
  total_tax DECIMAL(18,2) NOT NULL,
  digital_seal_hash VARCHAR(64) NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Checklist for Developers to Reach 100% Dynamic Production State

- [ ] **Auth**: Connect Auth0 / AWS Cognito to `POST /api/v1/auth/login` and populate `user` from token claims.
- [ ] **Exchange Rates**: Replace `MOCK_EXCHANGE_RATES` with daily scraper polling Banco de Moçambique.
- [ ] **Obligations**: Replace `INITIAL_OBLIGATIONS` with live query `GET /api/v1/obligations` populated from user invoices.
- [ ] **Alerts**: Enable `AlertSchedulerWorker` on backend cron to generate alerts dynamically at $T-7, T-3, T-1$.
- [ ] **Simulations**: Ensure history loads from `GET /api/v1/simulations` and saves to PostgreSQL.
- [ ] **Clients**: Connect `GET /api/v1/clients` and `POST /api/v1/clients` to corporate accounting firm database.
- [ ] **Payments**: Connect M-Pesa C2B and SIMO card webhooks to automatically update `companies.plan_renews_at`.
- [ ] **PDF Generator**: Enable S3 bucket upload with presigned URLs for simulation certificates.
