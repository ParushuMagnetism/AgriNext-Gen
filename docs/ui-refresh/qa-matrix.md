# QA Matrix

## Devices
- 360x800 (mobile baseline)
- 390x844 (mobile baseline)
- 768x1024 (tablet)
- 1366x768 (desktop)

## Languages
- English baseline pass for all touched routes.
- Kannada parity check for touched routes:
  - Heading wrapping
  - CTA width/overflow
  - Table and badge clipping

## Accessibility checks
- Keyboard-only navigation through:
  - Login/signup
  - Dashboard shell
  - Filters/tables
  - Dialogs/actions
- Focus indicator visible on all interactive controls.
- No keyboard traps in menus/dialogs.

## State handling checks
- Loading state shown for key data sections.
- Empty state shown with actionable guidance.
- Error state supports retry action where relevant.
- Success feedback uses consistent toast/status pattern.

## Visual regression scope
- All role dashboards.
- Two representative workflow pages per role.
- Public landing, login, signup, trace page.

## Critical journey checks
- Farmer: dashboard -> crops -> listing -> transport request.
- Agent: dashboard -> task update -> farmer detail.
- Logistics: loads -> active trip -> status progression.
- Buyer: browse -> product detail -> order flow.
- Admin: dashboard -> data health -> pending updates.
