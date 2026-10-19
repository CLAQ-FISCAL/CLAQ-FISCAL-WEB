# Implementation Plan — Adopt the remote `claq-backend` as the local backend

**Goal:** Make the local `backend/` match the remote `CLAQ-FISCAL/claq-backend` (plans + billing +
demo seeder + WAF + docs/CI), while preserving all local-only features and the working
pre-login onboarding flow.

**Strategy:** Remote files that don't exist locally are copied verbatim. Files present in both are
merged with the **remote as base** and local-only deltas re-applied on top. The local database and
migration numbering are preserved (no data loss, no rebuild).

---

## Current state (verified)

- **Shared, identical:** `api.ts`, `rules.ts`, `domain/{dashboard,obligations,reminders}`,
  `lib/{audit,crypto,db,http,tenant,whatsapp}`, `simulators/*`, `workers/{migrator,notifier,reminders}`,
  migrations `0001/0002/0004`.
- **Remote-only (safe to copy):** `src/billing/{stripe,webhook}.ts`, `src/workers/seed.ts`,
  `prisma/migrations/0005_plans_and_families`, `docs/`, `.github/`, `README.md`, `.gitignore`,
  `package-lock.json`, `claq-backend-foundation/`.
- **Both (must merge, remote-as-base):** `src/router.ts`, `prisma/schema.prisma`, `package.json`,
  `infra/stack.ts`, `infra/config.ts`, `config/{demo,prod}.json`, `prisma/seed.ts`,
  `scripts/build-lambdas.mjs`, `test/router.test.ts`.
- **Local-only (preserve untouched):** `src/modules/*`, `src/domain/uploads.ts`, `src/local.ts`,
  `test/uploads.test.ts`, migrations `0005_pgvector_and_payments`, `0006_upload_staging`,
  `0007_plans_and_families`.
- **Already ported (Phases 0–3 done):** `src/lib/plans.ts`, public `/v1/plans*` carve-out,
  `/v1/subscription` family+tenantType, `0007_plans_and_families` migration, DTO reconciliation
  (nested `limits`, numeric unlimited sentinel).
- **Baseline:** tsc clean · eslint clean · 130/130 tests pass · `/v1/plans` 200 without auth ·
  `/v1/subscription` 401 without auth.
- **DB:** `BillingSubscription` + `Invoice` tables **physically exist** (recreated by the drift
  reconcile) but are absent from `schema.prisma`. `_prisma_migrations` contains an orphan row
  `0008_billing_and_drift_reconcile` with no folder on disk.

---

## Decisions (confirm before starting)

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | DB strategy: keep current DB + local numbering, or `migrate reset`? | **Keep current DB** (preserves demo data; avoids re-applying 0005/0006/0007) |
| D2 | Keep `/v1/plans` public (pre-login) or restore remote's auth-gated version? | **Keep public** — required by the `PlanSelect` onboarding screen |
| D3 | Copy `claq-backend-foundation/` into `backend/`? | **Yes** — safe (tsc/eslint scopes exclude it) |
| D4 | Stripe billing vs. existing MPESA/EMOLA/SIMO payments | **Adopt Stripe as the plan/subscription engine**; keep MZN gateways for tax payments (no conflict — different domains). Fix `Invoice` schema bugs while porting. |
| D5 | Orphan migration row `0008_billing_and_drift_reconcile` | Leave as-is (harmless; a valid folder-less record). Only intervene if `migrate` complains. |

---

## Phase 0 — Safety net (no behaviour change)

- [ ] Commit current uncommitted work first (uploads backend + frontend onboarding) so the merge
      is reviewable and revertable. Suggested split:
  - `feat: add client upload staging/reconciliation (backend)` — schema, `0006`, `domain/uploads.ts`,
        router routes, `test/uploads.test.ts`.
  - `feat: add plan onboarding + server-driven simulators (frontend)` — `PlanSelect`, `DataUpload`,
        hooks, types, i18n, calculator refactor.
- [ ] Confirm `.env` is not committed (only `claq_audience`/localStorage are frontend-side).

## Phase 1 — Billing schema (additive, no behaviour change yet)

Goal: model Stripe without breaking local models or the existing DB.

- [ ] **Merge `prisma/schema.prisma`** (remote as base for billing, keep all local models/enums):
  - Add `Tenant.stripeCustomerId String? @unique`, `Tenant.billingSubscriptions[]`, `Tenant.invoices[]`.
  - Add `model BillingSubscription` (as remote) — indexed by `tenantId`, `stripeCustomerId`.
  - Add `model Invoice` — but **fix** remote's bugs: `amountDue Int` → `Decimal @db.Decimal(12,2)`,
        `currency` default `'mzn'` → `'MZN'`.
  - **Keep local models:** `PaymentTransaction`, `UploadBatch`, `StagingRow`, `LegalDocument`,
        `LegalArticle`, `ExchangeRateCache`, `NewsArticle`, `NewsletterSubscriber`, and enums
        `PaymentProvider/PaymentStatus/UploadStatus/MatchState/RowDecision`.
- [ ] **New migration** `0008_billing_models` (next free number; do NOT reuse remote's
      `0005_plans_and_families` — local equivalent is `0007`):
  - `ALTER TABLE "Tenant" ADD COLUMN "stripeCustomerId" TEXT;` + unique index.
  - `CREATE TABLE "BillingSubscription" (...)`, `CREATE TABLE "Invoice" (...)` — **IF NOT EXISTS**
        guard, because these tables already physically exist from the drift reconcile. Verify with
        `information_schema` first; if present, make the migration a no-op for them.
- [ ] `npx prisma generate && npx prisma validate && npx prisma migrate status`.

## Phase 2 — Billing module (copied verbatim, then typecheck)

- [ ] Copy `src/billing/stripe.ts`, `src/billing/webhook.ts` from the remote (byte-identical).
- [ ] **Fix the remote's latent signature bug** while integrating:
  - The handler reads `ctx.rawBody` / `ctx.rawHeaders`, which `RequestContext`/`createHandler` never
        populate → signature verification would always fail.
  - Add `rawBody: string` and `rawHeaders: Record<string,string>` to `RequestContext`; populate in
        `createHandler` from `event.body` (unparsed, `isBase64Encoded=false`) and `event.headers`.
  - Note: APIGW v2 lowercases headers → key is `stripe-signature`.
- [ ] **Add `stripe@^22.5.0`** to `dependencies` in `package.json`; union with local deps
      (`aws-jwt-verify`, `bcrypt`, `jsonwebtoken`, `pg`, …). Keep `"node": ">=22 <23"`.
- [ ] Add `seed: 'src/workers/seed.ts'` to `scripts/build-lambdas.mjs` (remote's 1-line diff).
- [ ] `npm install && npx tsc --noEmit` (expect: webhook.ts compiles against the new ctx fields).

## Phase 3 — Billing + seed routes (wiring)

- [ ] Copy `src/workers/seed.ts` from the remote.
- [ ] **Merge `src/router.ts`** (remote as base, local-only routes re-applied on top):
  - Add remote's **authenticated** routes: `/v1/billing/subscription`, `/v1/billing/invoices`.
  - Add **public** route `/v1/billing/webhook` (signature-verified, no JWT) to the existing
        `publicRoutes` array (alongside the public `/v1/plans*`), so it bypasses `ensureUser`.
  - **Re-apply all local-only routes** (uploads ×5, payments ×5, ai/chat, pdf, exchange-rates,
        news, newsletter/subscribe) and keep the public `/v1/plans*` block + `/v1/subscription`
        family/tenantType already present.
- [ ] `npm test` (expect: existing 130 pass; add small tests for billing subscription/invoices
      401-when-unauth and webhook MISSING_SIGNATURE).

## Phase 4 — Infra + config (remote as base, keep local)

- [ ] **Merge `infra/config.ts`**: add `enableWaf`, `wafAttachToApi`, `stripeSecretKey`,
      `stripeWebhookSecret`, `stripePrices`, `demoSeed`; **keep** local `mpesaWebhookSecret`.
- [ ] **Merge `config/demo.json`** (add `demoSeed{email,cognitoSub,displayName}`) and ensure
      **`config/prod.json` has NO `demoSeed`** (env-gated demo seeder must never run in prod).
- [ ] **Merge `infra/stack.ts`**:
  - Add remote's Stripe webhook route (public, no `authorizer`), keeping the local MPesa webhook
        and the **public `/v1/plans` + `/v1/plans/suggest`** routes.
  - Add the **env-gated `Custom::ClaqDemoSeed`** provider + resource (guarded by `!prod && cfg.demoSeed`),
        granting the DB secret read.
  - Enable remote's **WAF** block (rate-limit + AWS Common + SQLi), but **keep the local note/guard**
        that `CfnWebACLAssociation` is unsupported for HTTP API in af-south-1 (keep it behind
        `wafAttachToApi`, default off).
- [ ] `npm run synth -- --context env=demo` (and `env=prod`) — must synthesize cleanly.

## Phase 5 — Docs, CI, scaffold (no runtime impact)

- [ ] Copy `docs/` (API.md, ARCHITECTURE*, RUNBOOK, SECURITY, TAX-CONTENT + diagrams), `README.md`,
      `.gitignore`.
- [ ] Copy `.github/workflows/{verify,deploy}.yml`. Note `verify.yml` runs
      `lint && build && test && synth --context env=demo` — all must pass (see Verification).
- [ ] Copy `claq-backend-foundation/` (safe: excluded from `tsconfig` `include` and eslint `ignores`).
- [ ] Reconcile `README.md` with local reality (local has payments/uploads/AI not in remote docs) —
      add a short "local extensions" section rather than shipping remote docs verbatim.

## Phase 6 — Docs touch-ups (remote-as-truth, note divergences)

- [ ] `docs/API.md` and `docs/RUNBOOK.md`: add a **"Local extensions"** callout listing the
      upload/payment/AI/PDF endpoints that exist locally but not remotely, and noting `/v1/plans*`
      are intentionally public here.

---

## Verification (must all pass)

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm test` (130 + new billing tests)
- [ ] `npm run synth -- --context env=demo` and `--context env=prod`
- [ ] **Runtime (local dev server):**
  - `GET /v1/plans` → 200, no auth (public carve-out preserved).
  - `GET /v1/plans/suggest?annualRevenueMzn=…` → correct tier.
  - `GET /v1/subscription` → 401 without auth.
  - `GET /v1/billing/subscription`, `/v1/billing/invoices` → 401 without auth (JWT-gated).
  - `POST /v1/billing/webhook` → 400 MISSING_SIGNATURE without a header (public + signature-gated).
  - `GET /v1/uploads`, `/v1/ai/chat`, `/v1/payments/*` still route (401/403 as appropriate).
- [ ] Confirm no `stripe` import leaks into local-only modules.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| `BillingSubscription`/`Invoice` already exist physically but not in migration history | `IF NOT EXISTS` guards; verify with `information_schema` before authoring `0008` |
| Remote webhook signature bug (`rawBody`/`rawHeaders` unset) | Add both to `RequestContext` + `createHandler` (Phase 2) |
| Stripe + MPESA/EMOLA/SIMO coexist confusingly | Stripe = plan/subscription engine; MZN gateways = tax payments. Document the split |
| Remote's flat `/v1/plans` DTO breaks frontend | **Keep local nested-DTO `limitsDto`/`planDto`** (already Phase-2-aligned); do not adopt remote's `planDto` |
| WAF association unsupported in af-south-1 | Keep behind `wafAttachToApi` (default off), as local already does |
| `verify.yml` synthesizes demo → must compile | Run synth in Verification before enabling CI |
| Merging `package.json`/`package-lock.json` churn | Regenerate lock via `npm install`; do not hand-edit |

## Rollback

Every phase is additive and gated behind typecheck+tests+synth. If a phase breaks, revert that
file set (`git checkout -- backend/...`) — DB migrations are additive (`0008_billing_models`) and
safely reversible in dev via `prisma migrate reset` if needed (accepting demo-data loss).

---

## Open questions

1. Confirm **D1** (keep DB vs reset) — recommend keep.
2. Confirm **D4**: Stripe as plan engine alongside existing MZN payment gateways — recommend yes,
   with the domains kept distinct.
3. Should `docs/README` be shipped remote-verbatim or annotated as "local extensions"? Recommend
   annotated.