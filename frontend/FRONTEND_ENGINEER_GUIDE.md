# 🎨 CLAQ Fiscal Alert – Frontend Engineering Blueprint & Implementation Guide

---

## 1. Executive Overview & Role of the Frontend
Welcome to the Frontend Engineering Team of **CLAQ Fiscal Alert**. Your primary role is to build, polish, and maintain a state-of-the-art, enterprise-grade, high-performance web and mobile application for Mozambican tax compliance, simulation, and legal intelligence.

The application is built in **European Portuguese (`pt-PT`)** with strict adherence to Mozambican fiscal terminology, official currency notation (`286 875,00 MZN`), and date standards (`30/06/2026`).

---

## 2. Technical Stack & Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 18+ (TypeScript)** | Core component architecture with strict typing |
| **Build Tool** | **Vite 8+** | Ultra-fast HMR and optimized production bundling |
| **Server State & Cache** | **TanStack Query v5** (`@tanstack/react-query`) | Server-state caching, background refetching, optimistic updates |
| **Client UI State** | **AppStateContext** / **Zustand** | Modals, drawers, theme, and active client filter context |
| **Icons** | **Lucide React** (`lucide-react`) | Standardized, accessible SVG iconography |
| **PDF Rendering** | **jsPDF** & **Backend S3 Stream** | Client-side preview and official signed PDF certificate generation |
| **Celebrations** | **canvas-confetti** | Micro-interaction when obligations are settled or payments succeed |

---

## 3. Visual System, Theme Tokens & Design Guidelines

Our design system utilizes high-contrast Dark Navy paired with Warm Amber/Gold accents for financial gravity and trust.

### Color Palette (CSS Variables defined in `frontend/src/index.css`)
- **Primary Navy / Backgrounds**:
  - `var(--navy-950)`: `#0B132B` (Sidebar, hero card backdrops)
  - `var(--navy-900)`: `#0F172A` (Headers, modal headers)
  - `var(--navy-800)`: `#1E293B` (Dropdown menus, dark accents)
  - `var(--slate-50)`: `#F8FAFC` (Main application background)
- **Accent Gold / Amber (Action CTAs)**:
  - `var(--gold-500)`: `#F59E0B` (Primary action buttons, seal highlights)
  - `var(--gold-600)`: `#D97706` (Hover states)
  - `var(--gold-50)`: `#FFFBEB` (Highlighted cards & badges)
- **Status Indicators (Mozambican Fiscal Standard)**:
  - **Em Dia / Regular (Green)**: `#10B981` (`var(--emerald-500)`) – Obligations paid or compliant.
  - **A Vencer / Warning (Amber)**: `#F59E0B` (`var(--gold-500)`) – Due in $\le 7$ days.
  - **Vencidas / Crítico (Red)**: `#EF4444` (`var(--red-500)`) – Past due date.
  - **Informativo / Geral (Blue)**: `#3B82F6` (`var(--blue-500)`) – Legal news & municipal deadlines.

---

## 4. Screen-by-Screen Implementation Guide

### 1. Authentication & Onboarding (`/login`)
- **File**: `frontend/src/pages/Login.tsx`
- **What to do**:
  - Integrate **Auth0 / AWS Cognito** Single Sign-On (Google, Microsoft 365, Apple, Magic Links).
  - Implement 2-step onboarding KYC modal capturing Company Legal Name, 9-digit NUIT (`400889900`), and Fiscal Province (Maputo, Matola, Beira, Nampula, Tete, etc.).
  - Validate email addresses and Mozambican phone numbers (`+258 84/85/86/87`).

### 2. Executive Compliance Dashboard (`/dashboard`)
- **File**: `frontend/src/pages/Dashboard.tsx`
- **What to do**:
  - Fetch KPI cards using `useQuery` targeting `/api/v1/reports/dashboard`.
  - Render the interactive **Mini Calendar June 2026** with color-coded chips on the 10th (INSS), 20th (TAE), and 30th (IVA).
  - Render the animated **85% SVG Compliance Donut Chart** (12 Em Dia, 3 A Vencer, 0 Vencidas, 2 A Renovar).
  - Keep the **WhatsApp Quick Callout Banner** with direct pairing trigger.

### 3. Calendário Fiscal Interactivo (`/calendario`)
- **File**: `frontend/src/pages/Calendario.tsx`
- **What to do**:
  - Full-month grid with dynamic category pills (IVA, INSS, IRPS, IRPC, TAE, Alvará).
  - Filter by Tax Authority (AT - Autoridade Tributária, INSS, Município, BAU).
  - Clicking any date opens the **Day Detail Drawer** with countdown badges and a **"Marcar como Pago"** button with optimistic UI updates.
  - Export full month calendar to CSV/Excel.

### 4. Centro de Simuladores Tributários (`/simuladores`)
- **File**: `frontend/src/pages/Simuladores.tsx`
- **What to do**:
  - Multi-step wizard matching Screenshot 2:
    - **Step 1 (Inputs)**: Form with live Banco de Moçambique exchange rate fetch (USD, EUR, ZAR).
    - **Step 2 (Resultados)**: Output cards showing $10\,000\text{ USD} \times 63.75 = 637\,500\text{ MZN}$, Contra-Valor $796\,875\text{ MZN}$ (Fator 1,25), IVA 16% ($127\,500\text{ MZN}$), IRPC 20% ($159\,375\text{ MZN}$), Total = **$286\,875,00\text{ MZN}$**.
    - **Step 3 (04 – Memória de Cálculo)**: Step-by-step mathematical trace flow.
    - **Step 4 (05 – Base Legal)**: Tabbed citations for CIVA, CIRPC, Convenções de Dupla Tributação, and Diplomas.
    - **Step 5 (06 – Histórico)**: Table of past simulation runs with delete and download actions.
    - **Step 6 (07 – PDF Report)**: Click "Gerar PDF" to trigger the official certificate preview modal with digital seal and QR code verification.

### 5. Multi-Client Accounting Hub (`/clientes`)
- **File**: `frontend/src/pages/Clientes.tsx`
- **What to do**:
  - Table of corporate clients with NUIT search, health score bars, and status tags (`Regular`, `Alerta`, `Crítico`).
  - Company switcher dropdown in the top header (`Header.tsx`) allowing accountants to toggle between different client dashboards instantaneously.

### 6. Meios de Pagamento & Checkout (`/configuracoes`)
- **File**: `frontend/src/components/payments/CheckoutModal.tsx`
- **What to do**:
  - Tabbed payment checkout:
    1. **M-Pesa (Vodacom)**: Input `+258 84/85`, shows loading spinner waiting for mobile phone USSD PIN prompt.
    2. **E-Mola (Movitel)**: Input `+258 86/87`.
    3. **Cartão Ponto24 / SIMO / Visa**: Card number, validity, and CVV fields.
    4. **Bancos MZ**: Display Entidade `99001`, Referência `400 889 900`, and bank accounts for **Millennium BIM**, **BCI**, and **Standard Bank Moçambique**.

### 7. Assistente CLAQ AI & WhatsApp Directo
- **Files**: `frontend/src/components/ai/AIAssistantDrawer.tsx` & `frontend/src/components/whatsapp/WhatsAppModal.tsx`
- **What to do**:
  - Slide-out chatbot drawer with prompt pills and Markdown rendering of Mozambican fiscal answers.
  - WhatsApp pairing modal with live test alert dispatcher.

---

## 5. API Client & Server State Conventions

Always use `ApiClient` (`frontend/src/api/client.ts`) and TanStack Query hooks (`frontend/src/hooks/useFiscalQueries.ts`):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../api/client';

export function useSettleObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ApiClient.patch(`/obligations/${id}/settle`),
    onMutate: async (id) => {
      // Optimistic UI update
      await queryClient.cancelQueries({ queryKey: ['obligations'] });
      const previous = queryClient.getQueryData(['obligations']);
      queryClient.setQueryData(['obligations'], (old: any[]) =>
        old.map(o => o.id === id ? { ...o, status: 'pago' } : o)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['obligations'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
    }
  });
}
```

---

## 6. How to Run & Validate Locally

```bash
# From workspace root:
npm run dev:frontend

# Or from /frontend:
cd frontend
npm run dev
```
Open **`http://127.0.0.1:5173/`** to view your changes with instant Hot Module Replacement (HMR).
