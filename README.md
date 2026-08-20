# 🇲🇿 CLAQ Fiscal Alert – Enterprise Platform

> **Plataforma de Conformidade, Simulação Tributária e Inteligência Legal para Moçambique**

---

## 📚 Engineering Documentation & Handbooks

- 🎨 **[Frontend Engineering Handbook](frontend/FRONTEND_INSTRUCTIONS.md)**: UI components, TanStack Query v5 hooks, client validation, checkout modals, and PDF viewers.
- ⚙️ **[Backend Engineering Handbook](backend/BACKEND_INSTRUCTIONS.md)**: A to Z data flow, PostgreSQL RLS schema, Mozambican tax engines, M-Pesa/E-Mola gateways, WhatsApp Cloud API, and AWS Terraform infrastructure.

---

## 🏗️ Monorepo Architecture

```
/
├── frontend/                          # 🎨 React 18 + Vite SPA Client
│   ├── FRONTEND_INSTRUCTIONS.md       # Frontend engineering guide
│   └── src/                           # UI components, pages, hooks, api client
│
├── backend/                           # ⚙️ Node.js / TypeScript REST API Server
│   ├── BACKEND_INSTRUCTIONS.md        # Backend engineering guide
│   ├── prisma/                        # PostgreSQL schema & RLS migrations
│   └── src/                           # Tax engines, payment gateways, workers
│
├── infra/                             # ☁️ AWS Cloud Infrastructure
│   └── terraform/                     # RDS PostgreSQL, ECS Fargate, S3, Secrets
│
├── docker-compose.yml                 # Web, API, Database (PostgreSQL + pgvector), Redis
├── .env.example                       # Production environment configuration template
└── package.json                       # Monorepo workspaces orchestration
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Both Frontend & Backend Concurrently
```bash
npm run dev
```
- **Frontend SPA**: `http://127.0.0.1:5173/`
- **Backend REST API**: `http://127.0.0.1:4000/api/v1/`
- **API Health Telemetry**: `http://127.0.0.1:4000/api/v1/health`

### 3. Production Build
```bash
npm run build
```

---

## 🧮 Core Tax Engine & Calculation Logic
* **Non-Resident Cross-Border Services**: Factor $1.25$ Gross-up, $16\%$ IVA (Lei 1/2018), $20\%$ IRPC (Lei 34/2014) $\rightarrow$ e.g. $10\,000\text{ USD}$ at $63.75\text{ MZN} = 286\,875,00\text{ MZN}$ total tax.
* **INSS**: $3\%$ Trabalhador, $4\%$ Patronal.
* **Fines (Art. 101 LGT)**: $25\%$ ($\le 30$d), $50\%$ ($31-90$d), $100\%$ ($>90$d) + Banco de Moçambique MIMO benchmark daily interest.

---

## 🇲🇿 Payment Integrations
- **M-Pesa (Vodacom Moçambique)**: C2B USSD push (*848#) & B2B payouts.
- **E-Mola (Movitel Moçambique)**: C2B USSD push.
- **Cartão SIMO / Ponto24 / Visa**: National switch card processing.
- **Transferência Bancária**: Millennium BIM, BCI, and Standard Bank unique 9-digit payment references (Entidade: `99001`).
