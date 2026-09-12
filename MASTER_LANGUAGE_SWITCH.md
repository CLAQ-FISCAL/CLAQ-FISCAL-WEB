# MASTER: Language Switch (PT ⇄ EN) — CLAQ Fiscal Alert

> Status: **IMPLEMENTED** (see final section for completion checklist)
> Owner: Frontend (React 19 + Vite)
> Goal: One toggle in the top header that switches the *entire application* between
> **Portuguese (pt)** and **English (en)** — not a single hardcoded Portuguese string
> may remain visible when the toggle is set to English (and vice versa).

---

## 1. Overview & Requirements

1. A **language toggle** lives in the top `Header`, always visible (also on the Login screen).
2. Toggling must re-render **every** user-facing string app-wide:
   - Layout chrome (sidebar, header, toasts, FABs, modals)
   - All 11 pages (Dashboard, Calendário, Alertas, Simuladores, Relatórios, Biblioteca Legal,
     Clientes, Configurações, Newsletter, Suporte, Login/Register)
   - Data-driven content rendered by the UI (legal library, gazette feed, tax engine labels,
     fiscal template obligations, statuses/categories)
   - Server/Auth feedback strings (Cognito + legacy toasts)
3. Language choice is **persisted** (localStorage + user settings) and restored on reload.
4. Portuguese remains the fallback and default.

**Non-negotiable:** When `en` is active, zero visible Portuguese. When `pt` is active, zero English.

---

## 2. Architecture Decision

### Library: `i18next` + `react-i18next`
- Industry standard for React i18n; supports namespaces, interpolation, pluralization.
- Installed in `frontend` workspace only (a purely frontend concern).

### Translation storage: JSON resource files per namespace
```
frontend/src/i18n/
  index.ts                # i18next init, language restore, resources assembly
  LanguageToggle.tsx      # the toggle component (PT | EN)
  locales/
    pt/  common.json  header.json  sidebar.json  layout.json  login.json  state.json
          dashboard.json  calendar.json  alerts.json  reports.json  biblioteca.json
          clientes.json  config.json  newsletter.json  support.json  simuladores.json
          whatsapp.json  ai.json  checkout.json  pdf.json  data.json
    en/  (mirror structure — 100% key parity required)
```
JSON files (not TS objects) so feature-owners can work in parallel without merging conflicts.

### Key format
- Flat, dot-free keys inside each namespace are preferred BUT nested keys are used where
  a clear parent-child grouping exists (e.g. `dashboard.statCards.dueSoon`).
- Component usage: `t('calendar:title')`.

### Default language & persistence
- i18next init reads `localStorage.claq_language` (`'pt' | 'en'`), falls back to `'pt'`.
- `AppStateContext` exposes `language: AppLanguage` and `setLanguage(lng)`:
  - calls `i18n.changeLanguage(lng)`
  - persists `claq_language` + `settings.language` (SystemSettings.language) to localStorage
  - normalizes legacy `'pt-PT'` → `'pt'` on init so existing users upgrade cleanly
  - updates `document.documentElement.lang`

### Types
- `SystemSettings.language` type changes from `'pt-PT'` to `'pt' | 'en'` (`src/types/index.ts`).
- New exported type `AppLanguage = 'pt' | 'en'` in `src/i18n/index.ts`.

---

## 3. Component Contract

### `LanguageToggle.tsx`
- Rendered twice:
  1. In `Header` (right side, next to the search bar / WhatsApp button).
  2. In `Login` (top-right corner, dark background variant).
- Props: `variant?: 'light' | 'dark'` (dark = on navy login background).
- Displays two pill buttons `PT` / `EN`; the active one is highlighted.
- Uses `useAppState().language` + `setLanguage` + `i18n.language`.

---

## 4. Migration Conventions (how every file was converted)

When converting any component/page:

1. Import `useTranslation` from `react-i18next`; call `const { t } = useTranslation();`
   (may be called inside the component that renders the string).
2. Text used by **React components** → `t('ns:key')`.
3. Text used in **context/utility/data files** (AppStateContext toasts, alert generation,
   data files) cannot call the `useTranslation` hook. For those:
   - **Context functions** (toasts, alerts) call `i18n.t('ns:key', {...})` at **call time**
     (import `i18n` from `../i18n` and use `i18n.t`) so messages follow the current language.
     Interpolation uses the entity fields (e.g. `{{title}}`, `{{days}}`).
   - **Static data arrays** (legal docs, news, template obligations) become **functions**
     `getDocs(t)` / call sites pass `t`; alternative: persist an English mirror in the
     data resolver with `i18n.language` branching. Prefer passing `t` / `i18n.t` at render time.
4. Never translate: brand name (`CLAQ`, `Fiscal Alert`), codes (`NUIT`, `IVA`, `INSS`,
   `IRPS`, `IRPC`, `TAE`, `AT`, `BAU`), emails, phone numbers, URLs.
5. Interpolation variables use `{{doubleMustache}}`; pass values via `t('k', { var: v })`.
   Plural forms: `t('daysLabel', { count: n })` with `_one`/`_other` keys when needed.
6. `title="..."` tooltips, `placeholder="..."`, `aria-label` are user-facing → translate.
7. Currency/number/date formatting stays in existing `utils/formatters.ts` (locale-agnostic).

### The "nothing stays Portuguese" rule (enforcement)
- Every visible string must resolve via i18n. After migration:
  ```
  rg -n "'[A-Za-zÀ-ÿçãõáéíóú][^']{3,}'" frontend/src/pages frontend/src/components
  ```
  – any remaining string literal in JSX text/placeholder/title has to be reviewed.
- The **final gate** is the checklist in §13: switch toggle to EN, walk every screen,
  confirm zero Portuguese; repeat for PT.

---

## 5. Namespace → File ownership map

| Namespace | Where it's used |
|---|---|
| `common`   | shared labels/buttons (Save, Cancel, Search, Status, Actions…) |
| `header`   | Header.tsx (page titles, dropdowns, badges) |
| `sidebar`  | Sidebar.tsx |
| `layout`   | Layout.tsx (FAB tooltips, toasts container) |
| `login`    | Login.tsx + auth SSO + register modal |
| `state`    | AppStateContext.tsx (toasts, alert generation, auth messages) |
| `dashboard`| Dashboard.tsx |
| `calendar` | Calendario.tsx + utils/calendarEngine.ts |
| `alerts`   | Alertas.tsx |
| `reports`  | Relatorios.tsx |
| `biblioteca`| BibliotecaLegal.tsx + data/statutoryLegislation.ts + legal types |
| `clientes` | Clientes.tsx |
| `config`   | Configuracoes.tsx |
| `newsletter`| Newsletter.tsx + data/officialGazetteFeed.ts |
| `support`  | Suporte.tsx |
| `simuladores`| Simuladores.tsx + data/taxEngine.ts + PDFPreviewModal.tsx |
| `whatsapp` | WhatsAppModal.tsx |
| `ai`       | AIAssistantDrawer.tsx |
| `checkout` | CheckoutModal.tsx |
| `pdf`      | PDFPreviewModal.tsx |
| `data`     | data/initialData.ts, data/taxEngine.ts, statutoryLegislation.ts, officialGazetteFeed.ts, utils/formatters.ts |

---

## 6. Files to create / modify

**New files**
- `frontend/src/i18n/index.ts`
- `frontend/src/i18n/LanguageToggle.tsx`
- `frontend/src/i18n/locales/pt/*.json` (one per namespace)
- `frontend/src/i18n/locales/en/*.json` (mirror)

**Modified files**
- `frontend/package.json` (+`i18next`, `react-i18next`)
- `frontend/src/types/index.ts` (`SystemSettings.language` → `'pt' | 'en'`)
- `frontend/src/context/AppStateContext.tsx` (`language`, `setLanguage`, translate toasts/alerts)
- `frontend/src/components/layout/Header.tsx` (+toggle, translate chrome)
- `frontend/src/components/layout/Layout.tsx`, `Sidebar.tsx`
- `frontend/src/pages/*` (all 11)
- `frontend/src/components/*` (modals/drawers)
- `frontend/src/data/*`, `frontend/src/utils/*`
- `frontend/src/main.tsx` (import `./i18n` first so it initialises before render)

---

## 7. i18n initialisation (reference)

`src/i18n/index.ts`:
```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptCommon from './locales/pt/common.json';
import ptHeader from './locales/pt/header.json';
/* … every pt + en namespace … */

export type AppLanguage = 'pt' | 'en';
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['pt', 'en'];
export const isSupportedLanguage = (lng?: string | null): lng is AppLanguage =>
  lng === 'pt' || lng === 'en';

const stored = typeof window !== 'undefined' ? localStorage.getItem('claq_language') : null;

export const resources = {
  pt: { common: ptCommon, header: ptHeader /* … */ },
  en: { common: enCommon, header: enHeader /* … */ }
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: isSupportedLanguage(stored) ? stored : 'pt',
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
  returnNull: false
});

export default i18n;
```

`src/main.tsx` — add BEFORE `<App/>`:
```ts
import './i18n';
```

---

## 8. Language state in AppStateContext

Add to state & context:
```ts
const [language, setLanguageState] = useState<AppLanguage>(() =>
  isSupportedLanguage(settings.language) ? settings.language : 'pt');

const setLanguage = (lng: AppLanguage) => {
  setLanguageState(lng);
  updateSettings({ language: lng });
  localStorage.setItem('claq_language', lng);
  i18n.changeLanguage(lng);
  document.documentElement.lang = lng === 'pt' ? 'pt' : 'en';
};
```
Normalise legacy saved settings on init: `saved.language = 'pt-PT' ? 'pt' : 'en'`.

---

## 9. LanguageToggle component (reference layout)

```tsx
interface Props { variant?: 'light' | 'dark' }
const { language, setLanguage } = useAppState();
const options: { code: AppLanguage; label: string }[] = [
  { code: 'pt', label: 'PT' }, { code: 'en', label: 'EN' }
];
// pill buttons; active => gold/blue highlight; disabled look while switching
```

---

## 10. Data-driven content strategy

| Data | Strategy |
|---|---|
| `taxEngine.ts` (calculator metadata) | Labels/units → `i18n.t` at render time; keep numeric constants pure |
| `statutoryLegislation.ts` | Docs/full-text → `getLegalDocs(t)`; call at render with current `t` |
| `officialGazetteFeed.ts` | News → `getNews(t)`; same pattern |
| `initialData.ts` | Anything rendered → build via `t` in a factory fn |
| `calendarEngine.ts` | Month names `getMonthNamePt` → `getMonthName(t, month, year)` |
| Alert generation in context | `i18n.t` at generation time with entity interpolation |

Storage note: obligations/clients/simulations persisted in localStorage keep **PT titles**.
They are user-generated/proprietary strings and are NOT translated (same policy as a user's
own company name). Only the *system scaffolding* around them is translated.

---

## 11. Edge cases & decisions

- **Login screen**: toggle must appear BEFORE authentication (it's a sibling of the app,
  provided in `Login` layout). Language is stored client-side so the toggle is available pre-auth.
- **Toasts**: generated by context functions using `i18n.t` at the moment of firing —
  if the user switches language mid-session, subsequent messages use the new language.
- **`document.title`**: update per language in each page effect.
- **Interpolation with `{{ }}`**: verified against i18next syntax (no JSX inside values).
- **Statuses stored as PT enum values** (`'pago'`, `'a_vencer'`, `'concluido'`…):
  keep enum values as-is (data contract), translate only the **display label** via
  `statusLabels` mapping in the locale files.

---

## 12. Verification steps

```bash
npm run lint --workspace=frontend     # oxlint
npm run build --workspace=frontend    # tsc -b && vite build (catches missing keys via types when needed)
```
Manual QA:
1. Login → toggle EN → scroll every screen; zero Portuguese.
2. Toggle PT → everything reverts to Portuguese.
3. Reload page → language persists.
4. Trigger toasts (log in/out, add obligation) in both languages → messages in chosen language.
5. Data pages (Biblioteca Legal, Newsletter, Simuladores, Calendário template) in both languages.

---

## 13. Completion checklist (✅ = done)

- [x] i18next + react-i18next installed (frontend workspace)
- [x] `src/i18n/index.ts` init with pt/en resources + localStorage restore
- [x] `LanguageToggle` component (light + dark variants)
- [x] Toggle mounted in `Header` and on `Login`
- [x] `SystemSettings.language` typed `'pt' | 'en'`; legacy `'pt-PT'` normalised
- [x] `AppStateContext` exposes `language` + `setLanguage` (persists + `changeLanguage`)
- [x] Core chrome translated (Header, Sidebar, Layout, Login, toasts/alerts in context)
- [x] Dashboard page translated
- [x] Calendario page + calendarEngine months translated
- [x] Simuladores page + taxEngine + PDFPreviewModal translated
- [x] Relatorios page translated
- [x] Alertas page translated
- [x] BibliotecaLegal page + statutoryLegislation translated
- [x] Clientes page translated
- [x] Configuracoes page translated
- [x] Newsletter page + officialGazetteFeed translated
- [x] Suporte page translated
- [x] WhatsAppModal, AIAssistantDrawer, CheckoutModal, PDFPreviewModal translated
- [x] initialData / data factories translated
- [x] Build + lint green
- [ ] Manual PT/EN walkthrough + screenshot sanity check