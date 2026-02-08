# AgriNext Gen Architecture

## 1. System Overview
AgriNext Gen is a multi-role agri-platform built on React + Supabase for farmer operations, agent workflows, logistics, marketplace trading, and admin governance.

Primary actors:
- Farmer
- Agent
- Logistics/Transporter
- Buyer
- Admin
- Public consumer (traceability links)

Core goals:
- Digitize farm records and crop lifecycle
- Enable assisted operations via field agents
- Orchestrate farm-to-buyer transport
- Support marketplace listings/orders
- Add AI-assisted decision support
- Provide public traceability for listed produce

## 2. Runtime Architecture

### 2.1 Frontend (Client)
- Stack: Vite, React 18, TypeScript, Tailwind, shadcn UI
- Entry points: `src/main.tsx`, `src/App.tsx`
- State/data: TanStack Query + local component state
- Auth/session: Supabase auth client (`src/hooks/useAuth.tsx`)
- Routing and RBAC:
  - Public routes: `/`, `/about`, `/contact`, `/login`, `/signup`, `/trace/listing/:traceCode`
  - Protected role routes guarded by `ProtectedRoute` (`src/components/ProtectedRoute.tsx`)

### 2.2 Backend (Supabase)
- Postgres database with RLS policies (migrations in `supabase/migrations/`)
- Auth (users + session tokens)
- Storage buckets (crop media, soil reports, trip proofs, voice media, traceability assets)
- Edge Functions for secure mutations, AI orchestration, crawlers, and data pipelines (`supabase/functions/*`)

### 2.3 Integrations
- LLM gateway: `ai.gateway.lovable.dev`
- Perplexity: web and weather enrichment
- Firecrawl: source scraping
- ElevenLabs: text-to-speech

## 3. High-Level Components

### 3.1 Identity and Access
- `user_roles` maps user -> app role (`farmer`, `buyer`, `agent`, `logistics`, `admin`)
- `useAuth` resolves current role for route protection
- `ProtectedRoute` enforces page-level authorization

### 3.2 Farmer Operations
- Profile and location (`profiles`)
- Farmlands and crops (`farmlands`, `crops`)
- Crop diary and media (`crop_activity_logs`, `crop_media`)
- Soil reports (`soil_test_reports`)
- Listings/orders (`listings`, `market_orders`)
- Transport requests (`transport_requests`)
- Assistant + weather + prices (market/weather/AI functions)

### 3.3 Agent Operations
- Assignments (`agent_farmer_assignments`)
- Tasks (`agent_tasks`)
- Quick updates/field records (`agent_data`, `agent_activity_logs`)
- AI support (`agent-ai`)
- Voice note capture (`save-agent-voice-note`)

### 3.4 Logistics Operations
- Vehicle registry (`vehicles`, `transporters`)
- Load acceptance and trip execution (`transport_requests`, `trips`, `transport_status_events`)
- Secure status transitions via edge functions:
  - `accept-load`
  - `update-trip-status`
- Proof capture and issue reporting (`trip proofs`, `transport_issues`)

### 3.5 Marketplace Operations
- Buyer registry (`buyers`)
- Listing discovery and order placement (`listings`, `market_orders`)
- AI features (`marketplace-ai`)

### 3.6 Admin Operations
- Global monitoring and management pages under `src/pages/admin`
- Data health console for crawlers and quality metrics
- Seed/demo control functions
- AI ops (`admin-ai`)

### 3.7 Public Traceability
- Public page: `src/pages/trace/ListingTrace.tsx`
- Public edge endpoint: `public-listing-trace`
- Exposes controlled listing evidence based on per-listing `trace_settings`

## 4. Data and Control Flow

### 4.1 Standard Read Flow
1. Client hook/page calls Supabase query.
2. RLS enforces user-scoped access.
3. TanStack Query caches response.
4. Optional realtime channels invalidate caches.

### 4.2 Secure Mutation Flow (Example: logistics)
1. UI invokes edge function with JWT.
2. Function validates identity/role and business constraints.
3. Function performs authoritative update(s) with service role.
4. Function appends events/notifications.
5. Client invalidates relevant query caches.

### 4.3 AI-Augmented Flow (Farmer Assistant)
1. Router classifies user message category.
2. Farmer context loaded from internal DB.
3. Optional web context resolved from cache or Perplexity.
4. Composed prompt sent to gateway model.
5. Interaction logged to `ai_farmer_logs`.

### 4.4 Data Ingestion Flow
1. Segment/source crawlers run (manual/admin or scheduler path).
2. Raw records captured in `market_prices_raw` / `web_documents`.
3. Normalized tables updated (`market_prices`, `agri_advisories`).
4. Aggregations and confidence materialized to `market_prices_agg`.
5. Health/telemetry logged to `web_fetch_logs`.

## 5. Security Model
- Primary access control: Supabase Auth + RLS
- Client-side role guards are UX-level; DB/Edge checks are authoritative
- Sensitive mutations should use edge functions instead of direct client table writes
- Public trace endpoint uses allowlisted visibility and signed URLs

## 6. Reliability and Observability
- Realtime invalidation for critical user views
- Standardized error extraction utility (`src/lib/error-utils.ts`)
- Fetch pipeline telemetry (`web_fetch_logs`)
- AI/voice operation logs (`ai_*_logs`, `voice_ops_logs`)
- Pilot hardening checklist maintained (`docs/pilot_p0_checklist.md`)

## 7. Current Architectural Strengths
- Clear role-based route boundaries
- Strong Supabase-centered architecture (auth + db + edge + storage)
- Secure logistics mutation path moved to edge functions
- Practical AI architecture with context routing and caching
- Good operational visibility for crawler/data-health flows

## 8. Current Architectural Gaps (Cross-Cutting)
- README does not reflect actual system architecture
- Inconsistent mutation strategy (some modules still mutate directly from client)
- N+1 query patterns in several hooks (scaling risk)
- Missing automated test suite for critical business paths
- Mixed function authentication posture for admin/seed functions

## 9. Recommended Target State
- Standardize all critical writes through RPC/Edge (single domain service layer)
- Introduce integration tests for auth, transport lifecycle, and order lifecycle
- Add schema docs + generated ERD in CI
- Harden edge auth defaults and isolate seed/demo functions by environment
- Add structured logging correlation IDs across edge functions
