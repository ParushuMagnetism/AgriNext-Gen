# Sprint Backlog

## Sprint 1 - Foundation and shared primitives
1. Add semantic token groups and Tailwind mappings.
Acceptance:
- Token variables exist in `src/index.css`.
- Tailwind config exposes color/elevation/motion/radius mappings.

2. Introduce reusable shell/state components.
Acceptance:
- `PageShell`, `DataState`, `KpiCard`, `ActionPanel` created and documented in code.

3. Refactor role dashboards to shared shell pattern.
Acceptance:
- Farmer, Agent, Logistics, Marketplace, Admin dashboards use `PageShell`.
- Dashboard KPI sections use `KpiCard` where applicable.

## Sprint 2 - Workflow harmonization
1. Farmer-first workflow pages.
- Crops, Farmlands, Orders, Listings, Transport, Notifications, Settings.
Acceptance:
- Primary action and status hierarchy standardized.
- Loading/empty/error states use common patterns.

2. Cross-role harmonization.
- Agent tasks/farmer detail.
- Logistics loads/trips/detail.
- Marketplace browse/orders/profile.
- Admin key operational pages.
Acceptance:
- Filters, table density, and empty states are consistent.

3. Public/auth pass.
- Landing, auth, about, contact, trace.
Acceptance:
- Public pages consume same token system and interaction states.

## Sprint 3 - QA and stabilization
1. Accessibility pass.
Acceptance:
- Keyboard navigation and focus visibility validated.
- Contrast on key controls meets WCAG AA intent.

2. Visual regression pass.
Acceptance:
- Screenshot baseline captured for dashboard + top workflows.
- No major layout regressions at target breakpoints.

3. Documentation and contribution guide.
Acceptance:
- Architecture documentation includes UI system decisions.
- Contributor guide defines how to add new UI consistently.
