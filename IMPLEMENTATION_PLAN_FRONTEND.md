# Implementation Plan — Align the frontend with the local backend

**Goal:** Make the frontend consume the local backend (`backend/`) as its source of truth instead of
local mock state, while preserving the working pre-login onboarding flow and the upload/payment UIs.

**Strategy:** Additive, phase-gated. Each phase keeps the app runnable (offline/localStorage fallback
remains as a safety net until the backend call is verified). No backend changes are required for
Phases 1–6; Phase 7 (Stripe checkout) needs one new backend endpoint.

---

## Current state (verified)

- **Backend:** tsc clean · eslint clean · 138/138 tests pass · synth demo+prod clean.
  Public routes: `/v1/plans`, `/v1/plans/suggest`, `/v1/billing/webhook`, `/v1/payments/webhook/mpesa`.
  Auth-gated: everything else. Base path is `/v1` (not `/api/v1`).
- **Frontend:** Vite + React + TanStack Query. Heavy use of `localStorage` and mock data
  (`initialData.ts`, `taxEngine.ts`). Partial backend sync via `syncFromBackend()`.
- **Mismatch inventory:** frontend calls `/clients`, `/alerts`, `/auth/*`, `/obligations/:id/settle`,
  `/obligations/template/mozambique`, and DELETE routes that do not exist; response shapes use
  `{ data }` where backend returns `{ items }` / `{ items, total, limit, offset }`.
- **Already aligned:** plans catalogue + suggest, subscription/audience, companies list (via
  `useCompanies`), uploads staging/decision/apply, simulators catalogue + run, exchange rates, rules.

---

## Decisions (confirm before starting)

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Keep `localStorage` as offline fallback or remove it? | **Keep as fallback** for the first pass; remove only after backend sync is verified in prod. |
| D2 | Alerts: implement backend or keep local-only? | **Keep local-only** for now (no backend alerts module); document as frontend-only. |
| D3 | Auth: Cognito only, or keep legacy `/auth/*`? | **Cognito only**; delete legacy calls. Backend `/me` is the identity source. |
| D4 | Stripe plan checkout: frontend-direct or new backend endpoint? | **Add backend endpoint** `POST /v1/billing/checkout-session` (Phase 7) so secrets stay server-side. |
| D5 | Obligations refactor scope: full migration or adapter layer? | **Adapter layer first** (map `ObligationDto` → `FiscalObligation`), then migrate pages incrementally. |

---

## Phase 1 — API client & environment (no behaviour change)

- [ ] Set `VITE_API_URL` (and any proxy) so the base path is `/v1`, not `/api/v1`.
- [ ] Add typed wrappers to `src/api/client.ts`:
  - `getSubscription`, `getBillingSubscription`, `listInvoices` (for `/v1/billing/*`).
  - `getDashboard`, `getCalendar`, `getNotificationSettings`, `updateNotificationSetting`.
  - `createCompany`, `getCompany` (annual revenue support).
  - `createObligation`, `updateObligationStatus`, `generateObligations`.
  - `listSimulations`, `createSimulation`.
  - `listNews`, `subscribeNewsletter`, `chatAI`, `generatePDF`.
- [ ] Add missing types to `src/types/index.ts` (`BillingSubscription`, `Invoice`, `DashboardSummary`,
  `CalendarItem`, `NotificationSetting`) mirroring backend DTOs.
- [ ] `npm run build` (frontend) passes.

## Phase 2 — Endpoint + response-shape fixes (core sync)

- [ ] Replace `/clients` calls with `/companies` in `useFiscalQueries` (`useClients` → `useCompanies`).
- [ ] Fix response unwrapping:
  - obligations: `{ items, total, limit, offset }` instead of `{ data }`.
  - simulations: `{ items }` instead of `{ data }`.
- [ ] Replace `/obligations/:id/settle` with `PATCH /obligations/:id` body `{ status }`.
- [ ] Remove calls to non-existent routes (`/clients/:id` delete, `/simulations/:id` delete,
  `/obligations/:id` delete, `/obligations/template/mozambique`, `/alerts*`, `/auth/*`).
- [ ] Use backend `/me` for identity/tenants and Cognito for login/logout.
- [ ] Keep `localStorage` fallback but gate it behind a feature flag / env.
- [ ] Verify `syncFromBackend()` populates obligations + companies + simulations without console errors.

## Phase 3 — Companies & annual revenue

- [ ] Update `BackendCompany` consumers to read `annualRevenueMzn` and `suggestedCompanyPlan`.
- [ ] Company create/edit forms: send `annualRevenueMzn` so `/v1/companies` returns a suggested plan.
- [ ] `PlanSelect` / onboarding: use `useSuggestPlan` with the company’s revenue (already wired).

## Phase 4 — Obligations / dashboard / calendar adapter

- [ ] Add an adapter `toFiscalObligation(dto)` mapping backend `ObligationDto` → frontend `FiscalObligation`
  (status/period/category derivation, amount from rule where available).
- [ ] `useObligations` returns adapted list; pages keep working with the adapter.
- [ ] Dashboard page consumes `/v1/dashboard` (counts, compliance %, upcoming).
- [ ] Calendar page consumes `/v1/calendar`.
- [ ] Notification settings page consumes `/v1/notification-settings`.

## Phase 5 — Uploads (verify + polish)

- [ ] Verify `StagedRowView` / `StagedBatchView` against backend `loadBatchView` output; fix field names.
- [ ] Ensure `useStageUpload`, `useDecideUploadRows`, `useApplyUpload` invalidate the right query keys
  (obligations + companies) after apply.
- [ ] Surface `MatchState`/`RowDecision` filters in the UI (already typed).

## Phase 6 — Payments wiring

- [ ] Wire `CheckoutModal` to `/v1/payments/{mpesa,emola,simo,bank-transfer}`.
- [ ] Persist transaction result and update `PaymentTransaction` status via the mpesa webhook flow.
- [ ] Keep MZN gateways clearly labelled as tax-payment (not plan subscription).

## Phase 7 — Billing / Stripe (needs backend addition)

- [ ] Backend: add `POST /v1/billing/checkout-session` (creates a Stripe Checkout session for a plan).
- [ ] Frontend: add “Upgrade plan” flow calling the new endpoint, then redirect to Stripe.
- [ ] Billing page: consume `/v1/billing/subscription` + `/v1/billing/invoices` (status, period, invoice list).
- [ ] Show plan limits from `/v1/subscription` (already in `useAudience`).

## Phase 8 — Simulators & content

- [ ] Ensure simulator pages use `useRunSimulator` (server-authoritative) instead of only local calc.
- [ ] Consume `/v1/exchange-rates`, `/v1/news`, `/v1/newsletter/subscribe`, `/v1/ai/chat`, `/v1/pdf/generate`
  in their respective pages (types + hooks already partially exist).

## Phase 9 — Cleanup

- [ ] Remove or archive mock-only modules (`initialData.ts`, `taxEngine.ts`) once backend sync is verified.
- [ ] Remove legacy `/auth/*` and `/alerts*` call sites.
- [ ] Remove `localStorage` fallback after a stable release (or keep behind env flag).

---

## Verification (must all pass)

- [ ] `npm run build` (frontend) passes with no type errors.
- [ ] `npm test` (frontend, if present) passes.
- [ ] With `VITE_API_URL=http://localhost:4000`:
  - PlanSelect loads plans without auth.
  - Login → `/me` resolves tenants; `X-Tenant-Id` set.
  - Dashboard shows backend counts.
  - Upload a CSV → reconcile → apply → obligations update.
  - Payment flow posts to `/v1/payments/*`.
  - Billing page shows subscription + invoices (demo).
- [ ] No console errors on the main flows; offline fallback still works when backend is down.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Local mock data masks backend errors | Keep `console.warn` on fallback; add a visible “offline” badge in dev. |
| Response-shape drift breaks pages | Adapter layer (Phase 4) isolates mapping; add integration tests per hook. |
| Stripe secrets in frontend | Never expose; route through backend checkout endpoint (Phase 7). |
| Large refactor of obligations | Incremental adapter; keep old code paths behind a flag until verified. |

## Rollback

Each phase is additive. Revert the affected hooks/types; `localStorage` fallback keeps the app usable
offline. Backend is untouched by this plan.
