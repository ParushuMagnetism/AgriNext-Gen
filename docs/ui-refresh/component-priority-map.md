# Component Priority Map

## Shared primitives (high priority to standardize)
- `src/components/layout/PageShell.tsx`
- `src/components/ui/DataState.tsx`
- `src/components/dashboard/KpiCard.tsx`
- `src/components/dashboard/ActionPanel.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/toast.tsx`

## Shared shell/navigation
- `src/layouts/DashboardLayout.tsx`
- `src/components/dashboard/DashboardHeader.tsx`
- `src/components/dashboard/DashboardSidebar.tsx`
- `src/components/ProtectedRoute.tsx`

## Farmer-specific dashboard modules
- `src/components/farmer/FarmerSummaryCard.tsx`
- `src/components/farmer/QuickActions.tsx`
- `src/components/farmer/MarketPricesWidget.tsx`
- `src/components/farmer/WeatherWidget.tsx`
- `src/components/farmer/TransportSection.tsx`

## Agent-specific dashboard modules
- `src/components/agent/AgentSummaryCards.tsx`
- `src/components/agent/TodaysTaskList.tsx`
- `src/components/agent/PendingTransportList.tsx`
- `src/components/agent/AIInsightsPanel.tsx`

## Logistics-specific dashboard modules
- `src/components/logistics/TripStatusStepper.tsx`
- `src/components/logistics/ProofCaptureDialog.tsx`
- `src/components/logistics/IssueReportDialog.tsx`

## Marketplace-specific dashboard modules
- `src/pages/marketplace/Browse.tsx`
- `src/pages/marketplace/ProductDetail.tsx`
- `src/pages/marketplace/Orders.tsx`

## Admin-specific dashboard modules
- `src/pages/admin/DataHealth.tsx`
- `src/pages/admin/PendingUpdates.tsx`
- `src/pages/admin/AIConsole.tsx`

## Public/Auth modules
- `src/pages/Index.tsx`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/pages/trace/ListingTrace.tsx`
