# 🎨 CLAQ Fiscal Alert – Frontend Engineering Handbook

## 1. Role & High-Level Scope
As the Frontend Engineer, your goal is to maintain and expand the production React 18+ (TypeScript) Single Page Application (SPA). You are responsible for the user interface, client-side validation (NUIT, MZN currency, Mozambican dates), server-state synchronization via TanStack Query v5, PDF rendering/download flows, and interactive payment checkouts.

---

## 2. Technology Stack & Key Libraries

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | React 18.3+ / TypeScript 5.6+ / Vite 8.2+ | High-performance SPA with fast HMR |
| **Server State** | `@tanstack/react-query` v5 | Caching, background polling, optimistic mutations |
| **Global UI State** | React Context (`AppStateContext.tsx`) / Zustand | Theme, sidebar toggle, active modal drawers |
| **Icons & Typography** | `lucide-react`, Plus Jakarta Sans | Consistent, modern visual design system |
| **PDF Generation** | `jspdf` (client preview) + S3 Presigned URLs | Immediate client preview & official server downloads |
| **Confetti & Effects**| `canvas-confetti` | Visual celebration on tax settlement & payments |

---

## 3. Directory Structure & Key Files

```
frontend/src/
├── api/
│   └── client.ts                     # Axios/Fetch client with automatic JWT Bearer headers
├── hooks/
│   └── useFiscalQueries.ts           # TanStack Query custom hooks (useObligations, useSimulations...)
├── context/
│   └── AppStateContext.tsx           # Global UI state (modals, active drawer, toast notifications)
├── components/
│   ├── layout/                       # Sidebar.tsx, Header.tsx, Layout.tsx
│   ├── common/                       # ClaqLogo.tsx
│   ├── ai/                           # AIAssistantDrawer.tsx (Slide-out tax intelligence chat)
│   ├── whatsapp/                     # WhatsAppModal.tsx (QR pairing & test dispatcher)
│   ├── simulators/                   # PDFPreviewModal.tsx (Official digital certificate viewer)
│   └── payments/                     # CheckoutModal.tsx (M-Pesa, E-Mola, SIMO, Bank Transfers)
├── pages/
│   ├── Login.tsx                     # Screen 0: Split-screen auth with Google/Microsoft/Apple SSO
│   ├── Dashboard.tsx                 # Screen 1: 4 KPI cards, Mini Calendar June 2026, 85% compliance donut
│   ├── Calendario.tsx                # Screen 2: Full month interactive fiscal grid with filters
│   ├── Simuladores.tsx               # Screen 3: 7-part simulator hub (Non-residents, INSS, IVA, Fines)
│   ├── Relatorios.tsx                # Screen 4: Financial breakdown (185.680,00 MZN) & CSV export
│   ├── BibliotecaLegal.tsx           # Screen 5: Legal document reader with category filters
│   ├── Clientes.tsx                  # Screen 6: Multi-client accounting management table
│   ├── Configuracoes.tsx             # Screen 7: Notification timings (7d, 3d, 1d), profile, subscription
│   ├── Alertas.tsx                   # Central de Alertas with severity filtering
│   ├── Newsletter.tsx                # Weekly fiscal gazette bulletin
│   └── Suporte.tsx                   # Maputo office contact form & Mozambican tax FAQs
└── utils/
    └── formatters.ts                 # formatMZN(), formatDate(), formatCurrency()
```

---

## 4. Step-by-Step Feature Implementation Guidelines

### A. Authentication & Onboarding Flow (`/login`)
1. **SSO Redirects**: Point Google, Microsoft 365, and Apple buttons to backend OAuth endpoints (`/api/v1/auth/{provider}`).
2. **Local Login Validation**:
   - Validate NUIT (must be exactly 9 numeric digits) or standard email format.
   - Store access tokens in memory / secure storage and set `localStorage.setItem('claq_jwt_token', token)`.
3. **Session Check**: On application boot, call `GET /api/v1/auth/me` to hydrate active user and company profile.

---

### B. Fiscal Calendar & Real-Time Alerts (`/calendario`, `/dashboard`, `/alertas`)
1. **Fetching Obligations**: Use `useObligations()` hook.
2. **Status Color Mapping**:
   - `pago` (Settled) $\rightarrow$ Emerald Green (`#10B981`)
   - `a_vencer` (Due within 7 days) $\rightarrow$ Warm Amber (`#F59E0B`)
   - `vencido` (Overdue) $\rightarrow$ Critical Red (`#EF4444`)
   - `a_renovar` (Licence renewal) $\rightarrow$ Royal Blue (`#3B82F6`)
3. **Mark as Settled (Optimistic Update)**:
   - When the user clicks "Marcar como Pago", call `useSettleObligation.mutate(obligationId)`.
   - Trigger `confetti()` animation and toast notification immediately.

---

### C. Tax Simulator & Memória de Cálculo (`/simuladores`)
1. **Live Exchange Rate Synchronization**:
   - Fetch real-time BM exchange rates using `ApiClient.get('/exchange-rates/latest')`.
   - Automatically update `Valor em Meticais` ($Amount \times Rate$).
2. **Mathematical Precision**:
   - Always display currency using `formatMZN(value)` $\rightarrow$ `286 875,00 MZN` (space as thousands separator, comma for decimals).
3. **Memória de Cálculo Tab**:
   - Render the 5-step visual flowchart showing Base, Contra-Valor (Fator 1,25), IVA 16%, IRPC 20%, and Total Tax.
4. **PDF Certificate Generation**:
   - Trigger `POST /api/v1/simulations/export-pdf` to receive the official S3 download link with cryptographic QR code.

---

### D. Mozambican Payment Checkout Modal (`CheckoutModal.tsx`)
1. **M-Pesa Tab**:
   - Validate phone prefixes (`84` or `85`).
   - Show loading spinner: *"Aguardando confirmação PIN no seu telemóvel..."*.
2. **E-Mola Tab**:
   - Validate phone prefixes (`86` or `87`).
3. **Cartão SIMO / Visa Tab**:
   - Validate Luhn algorithm on card numbers.
4. **Transferência Bancária Tab**:
   - Display copyable Entidade (`99001`) and Referência (`400 889 900`) alongside NIB/IBANs for Millennium BIM, BCI, and Standard Bank.

---

## 5. Coding Standards & Best Practices
- **Never hardcode raw API URLs**: Always use `import.meta.env.VITE_API_URL`.
- **Zero Raw Numbers**: Always use `formatMZN()` or `formatDate()` from `src/utils/formatters.ts`.
- **Accessibility**: All interactive buttons, inputs, and modals must include descriptive `aria-label` or `title` attributes.
