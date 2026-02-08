# Module-by-Module Audit, Risks, and Exact Fixes

This audit is prioritized by severity and implementation effort.

## Critical Findings

### C1. Edge function auth posture allows unauthenticated execution paths
- Risk:
  - Some functions are configured with `verify_jwt = false`, which allows invocation without a verified JWT.
  - In current code, admin-only checks are conditional on header presence; missing header can bypass role verification for some flows.
- Evidence:
  - `supabase/config.toml`:
    - `[functions.seed-test-data] verify_jwt = false`
    - `[functions.sync-karnataka-mandi-prices] verify_jwt = false`
    - `[functions.generate-price-forecast] verify_jwt = false`
- Exact fix:
  1. Restrict dangerous functions by environment.
  2. Make admin check mandatory in code when function is not scheduler-only.
  3. Keep scheduler entry points on separate internal-only functions.
- Changes:
  - In `supabase/config.toml`, set `verify_jwt = true` for `seed-test-data` (or remove from prod deploy).
  - For `sync-karnataka-mandi-prices` and `generate-price-forecast`:
    - Option A: split into `*-cron` (verify_jwt false) and `*-admin` (verify_jwt true)
    - Option B: keep single function with required signed internal secret header for no-JWT calls.

### C2. get-weather token handling is brittle and mixes trust boundaries
- Risk:
  - `get-weather` decodes JWT payload manually and calls `auth.admin.getUserById(sub)`.
  - Even if platform JWT verification is enabled, this approach is unnecessary and can become insecure if config changes.
- Evidence:
  - `supabase/functions/get-weather/index.ts`
- Exact fix:
  1. Remove manual JWT decode.
  2. Build a user-scoped Supabase client from `Authorization` header.
  3. Resolve user via `userClient.auth.getUser()` only.
- Patch intent:
  - Replace admin lookup logic with:
    - `const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader }}})`
    - `const { data: { user } } = await userClient.auth.getUser()`

## High Findings

### H1. N+1 query patterns in critical hooks increase latency and DB load
- Risk:
  - Many list pages fetch base rows, then per-row extra queries.
  - This scales poorly and slows dashboards.
- Evidence:
  - `src/hooks/useTrips.tsx` (farmer/crop enrichment per trip)
  - `src/hooks/useFarmerDashboard.tsx` (`useFarmerOrders` enrichment per order)
  - `src/hooks/useAgentDashboard.tsx` (`useAgentTasks` and `useTodaysTasks` enrichment per task)
- Exact fix:
  1. Use single select with nested joins where FK exists.
  2. Create SQL views/RPCs for complex denormalized reads.
  3. Add pagination on heavy pages.
- Patch intent:
  - Introduce RPCs:
    - `get_agent_tasks_with_context(agent_id)`
    - `get_farmer_orders_with_context(farmer_id)`
    - `get_trips_with_context(transporter_id, status_filter)`

### H2. Mutation strategy is inconsistent across modules
- Risk:
  - Logistics mutations are secure via edge functions; other modules still perform direct client writes.
  - This increases policy complexity and risk of bypasses if RLS is incomplete.
- Evidence:
  - `src/hooks/useAgentDashboard.tsx` direct updates to `agent_tasks` and `crops`
  - Other direct table mutations across hooks/pages
- Exact fix:
  1. Define "protected mutation boundary" policy.
  2. Move high-value mutations to RPC/Edge:
    - task status updates
    - crop status updates by agent
    - admin data updates
  3. Keep client direct writes only for low-risk, strictly self-scoped records.

### H3. No automated tests for business-critical flows
- Risk:
  - Race-condition, status-transition, and permission regressions can reappear.
- Evidence:
  - No meaningful test suite present (`rg --files -g "*test*" -g "*spec*"` returned only a UI helper file)
- Exact fix:
  1. Add integration tests for edge functions (`accept-load`, `update-trip-status`).
  2. Add auth/role access tests for route guards and function invocation.
  3. Add smoke tests for key pages per role.
- Minimum test matrix:
  - Transport accept race
  - Invalid status transitions
  - Proof-required transitions
  - Unauthorized role invocation

## Medium Findings

### M1. README is not aligned to actual architecture
- Risk:
  - Slows onboarding and raises operational mistakes.
- Evidence:
  - `README.md` is default template text.
- Exact fix:
  1. Replace with project-specific sections:
    - architecture diagram
    - local setup
    - required env vars
    - role matrix
    - edge function catalog
    - migration and deploy process

### M2. Seed/demo functions should be explicitly environment-gated
- Risk:
  - Accidental execution in non-demo environments can pollute production data.
- Evidence:
  - `supabase/functions/seed-test-data/index.ts`
  - `supabase/functions/seed-mysuru-demo/index.ts`
- Exact fix:
  1. Require `ALLOW_SEEDING=true` env guard.
  2. Require admin + explicit confirmation token in request body.
  3. Fail closed when env var/token missing.

### M3. Encoding/locale artifacts in some UI/docs strings
- Risk:
  - User-facing text quality issues for multilingual audiences.
- Evidence:
  - Garbled characters visible in multiple outputs (likely encoding mismatch)
- Exact fix:
  1. Normalize file encoding to UTF-8.
  2. Add lint/check in CI for invalid byte sequences.
  3. Keep i18n files reviewed with language QA.

## Low Findings

### L1. Query key conventions are not fully standardized
- Risk:
  - Invalidation misses and stale caches in edge cases.
- Evidence:
  - Mixed key styles across hooks/pages.
- Exact fix:
  1. Define central `queryKeys.ts`.
  2. Refactor hooks to shared key factory.

### L2. Observability can be improved with correlation IDs
- Risk:
  - Harder root-cause analysis across chained edge-function flows.
- Exact fix:
  1. Generate request ID at edge entry.
  2. Include in all logs + inserted telemetry rows.

## Module Audit Summary

### Frontend Core (`src/App.tsx`, auth/route providers)
- Status: good role separation and route protection.
- Risks: role-fetch race states handled, but user-role creation dependency should remain server-side authoritative.
- Fixes:
  - Keep role assignment trigger authoritative.
  - Add integration test for signup -> role -> redirect.

### Farmer Module (`src/pages/farmer/*`, `src/hooks/useFarmer*`, `src/hooks/useMarketData.tsx`)
- Status: feature-rich and hardened in P0 checklist.
- Risks: data-fetch fanout in some hooks.
- Fixes:
  - Replace per-row enrich calls with joined views/RPC.

### Agent Module (`src/pages/agent/*`, `src/hooks/useAgentDashboard.tsx`)
- Status: strong functional coverage.
- Risks: direct client mutations for sensitive updates.
- Fixes:
  - Move task/crop mutation paths to RPC/Edge.
  - Add stricter policy checks and tests for assignment boundaries.

### Logistics Module (`src/pages/logistics/*`, `src/hooks/useTrips.tsx`)
- Status: strongest mutation security posture currently.
- Risks: read-query enrichment still N+1.
- Fixes:
  - Build denormalized read endpoint/view for trips.

### Marketplace Module (`src/pages/marketplace/*`)
- Status: stable baseline; AI integration present.
- Risks: ensure order lifecycle writes are uniformly protected.
- Fixes:
  - Review all order mutations and consolidate sensitive writes.

### Admin Module (`src/pages/admin/*`)
- Status: good operations visibility and controls.
- Risks: admin-only functions should not accept unauthenticated paths.
- Fixes:
  - Enforce JWT/internal-secret patterns per function category.

### Edge Functions (`supabase/functions/*`)
- Status: broad capability set and useful logging.
- Risks: auth consistency and long-term maintainability.
- Fixes:
  - Classify functions: `public`, `authenticated`, `admin`, `internal-cron`.
  - Enforce one auth pattern per class.

### Data/Crawling/Forecast Pipeline
- Status: practical ETL + aggregation model.
- Risks: pipeline fragility without integration tests and strict auth boundaries.
- Fixes:
  - Add end-to-end test harness for crawl -> aggregate -> dashboard availability.

## 30-60-90 Day Remediation Plan

### 0-30 days (high impact)
1. Lock function auth posture (`verify_jwt` + admin/internal checks).
2. Refactor `get-weather` auth flow to verified user client pattern.
3. Add tests for logistics race and status transitions.
4. Replace README with architecture-aware documentation.

### 31-60 days (performance and consistency)
1. Eliminate major N+1 hooks with RPC/views.
2. Move agent critical mutations to RPC/Edge.
3. Standardize query keys and mutation invalidation strategy.

### 61-90 days (operational maturity)
1. Add correlation IDs and structured logs.
2. Add CI checks for encoding + migration safety.
3. Add scheduled pipeline health assertions and alerting.

## Exact Fix Backlog (Actionable)
1. `supabase/config.toml`: reclassify function auth settings by function type.
2. `supabase/functions/get-weather/index.ts`: remove manual JWT decode and admin user-by-id auth pattern.
3. `src/hooks/useAgentDashboard.tsx`: replace direct `update/insert` mutations with RPC/Edge wrappers.
4. `src/hooks/useTrips.tsx`: replace per-trip enrich queries with single denormalized source.
5. `src/hooks/useFarmerDashboard.tsx`: replace per-order enrich loops with joined query or RPC.
6. `README.md`: replace template with real setup/runbook.
7. Test suite scaffold: add edge-function integration tests for transport + auth.
