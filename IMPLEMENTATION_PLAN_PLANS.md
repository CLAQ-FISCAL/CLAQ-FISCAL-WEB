# Implementation Plan — Show all backend plans in PlanSelect

**Goal:** Make the pre-login `PlanSelect` screen render every plan returned by `/v1/plans`
for both the accountant and company audiences, instead of only the suggested company plan.

**Strategy:** Additive UI change. Keep the revenue qualifier for company tier suggestion, but
also list the full `families.COMPANY` catalogue. No backend changes required.

---

## Current state (verified)

- `usePlans()` fetches `/v1/plans` and exposes `families.ACCOUNTANT` and `families.COMPANY`.
- Accountant branch already maps `accountantPlans` to `PlanCard`s.
- Company branch only renders `suggestQuery.data.suggested` (single card).
- Root cause of "no plans": base URL mismatch (`/api/v1` vs `/v1`) — must be fixed first.

---

## Phase 1 — Data source (prerequisite)
- [ ] Set `VITE_API_URL` to backend URL ending in `/v1`.
- [ ] Verify `/v1/plans` returns both families + `revenueThresholds`.

## Phase 2 — Company catalogue rendering
- [ ] Read `companyPlans = plansQuery.data?.families.COMPANY ?? []`.
- [ ] Render all company plans as `PlanCard`s (in addition to the suggested one).
- [ ] Highlight the suggested plan when `suggestQuery.data.suggested` is available.
- [ ] Keep loading/error states for both `plansQuery` and `suggestQuery`.

## Phase 3 — Selection & persistence
- [ ] Allow `selectedPlan` to be any code from either family list.
- [ ] Preserve `confirm(planCode)` behaviour (already saves audience + intent plan).

## Phase 4 — Verification
- [ ] PlanSelect shows accountant plans without auth.
- [ ] PlanSelect shows company plans after entering revenue (and optionally before).
- [ ] Selecting any plan and continuing stores the intent plan.
- [ ] `npm run build` (frontend) passes.

## Risks
- If `plansQuery` fails, the grid stays empty; keep the retry button.
- If `suggestQuery` fails, still show the full company list.
- Avoid duplicate card keys (use `plan.code`).
