# Agri Mitra - Pilot P0 Checklist

This document tracks acceptance tests for P0 hardening phases.

---

## Phase 0: Prep for P0 Hardening ✅

- [x] All mutation errors show clear toast messages
- [x] Error utility (`getErrorMessage`) extracts Supabase/Edge errors cleanly
- [x] All action buttons disable while loading
- [x] No silent failures in any flow

---

## Phase 1: Fix Transporter Accept Race Condition ✅

### Test: Two Transporters Accept Same Load

**Setup:**
1. Open 2 browser tabs/windows logged in as 2 different transporter accounts
2. Navigate to `/logistics/loads` in both

**Steps:**
1. Find the same available load in both tabs
2. Click "Accept" in both tabs within 1 second
3. Confirm in both dialogs simultaneously

**Expected:**
- [x] Only ONE transporter succeeds with "Load accepted successfully!" toast
- [x] The OTHER gets "This load has already been accepted by another transporter" toast
- [x] Database shows only 1 trip created for that transport_request
- [x] Available loads list refreshes in both tabs (load disappears)

**Verify in DB:**
```sql
SELECT * FROM trips WHERE transport_request_id = '<id>';
-- Should return exactly 1 row

SELECT * FROM transport_status_events WHERE transport_request_id = '<id>';
-- Should show 1 assignment event
```

---

## Phase 2: Consolidate Transporter Mutations ✅

### Test: No Direct DB Updates

- [x] `useAcceptLoad` hook removed from `useLogisticsDashboard.tsx`
- [x] `useUpdateTripStatus` hook removed from `useLogisticsDashboard.tsx`
- [x] `AvailableLoads.tsx` uses `useAcceptLoadSecure` from `useTrips.tsx`
- [x] `ActiveTrips.tsx` uses secure hooks from `useTrips.tsx`
- [x] All status updates go through edge functions

**Verify:**
```bash
# Search codebase - should find 0 matches in pages
grep -r "useAcceptLoad\|useUpdateTripStatus" src/pages/
```

---

## Phase 3: Upload Hardening ✅

### Test: Large Image Compression

**Steps:**
1. Go to Crop Diary for any crop
2. Click "Upload Photo"
3. Select a 10MB+ image

**Expected:**
- [x] Shows "Compressing..." state
- [x] Then shows "Uploading..."
- [x] Upload succeeds
- [x] Final uploaded image < 2MB in storage

### Test: Oversized Image Rejection

**Steps:**
1. Try to upload a 20MB image in any upload dialog

**Expected:**
- [x] Toast: "File too large. Maximum size is 15MB"
- [x] Upload blocked before network request

### Test: PDF Size Limit

**Steps:**
1. Go to Soil Reports
2. Try to upload a 15MB PDF

**Expected:**
- [x] Toast: "File too large. Maximum size is 10MB"
- [x] Upload blocked

### Test: Upload Failure Retry

**Steps:**
1. Simulate network failure during upload (DevTools -> Offline)
2. Attempt upload

**Expected:**
- [x] Clear error toast with "Retry" action button
- [x] Click Retry → re-attempts upload
- [x] Loading state resets properly

---

## Phase 4: Agent Soil Report RLS ✅

### Test: Agent Upload Without agent_data

**Setup:**
- Agent account with `agent_farmer_assignments` row for a farmer
- NO row in `agent_data` table for that farmer

**Steps:**
1. Login as agent
2. Go to assigned farmer's profile
3. Click "Upload Soil Report"
4. Complete form with consent checkbox checked

**Expected:**
- [x] Upload succeeds
- [x] Report visible in farmer's soil report history
- [x] `consent_captured = true` in database

### Test: Agent Without Assignment Blocked

**Steps:**
1. Try to upload soil report for farmer NOT in `agent_farmer_assignments`

**Expected:**
- [x] Error: "You don't have permission for this farmer"

---

## Phase 5: Trust & Data Integrity ✅

### Test: Crop Photo Delete Confirmation

**Steps:**
1. Go to Crop Diary photo gallery
2. Click delete on any photo

**Expected:**
- [x] Confirmation dialog appears: "Delete this photo? This cannot be undone."
- [x] Cancel → photo remains
- [x] Confirm Delete → photo removed

### Test: last_photo_at Server Trigger

**Steps:**
1. Upload a photo for a crop
2. Check crop record in database

**Expected:**
- [x] `last_photo_at` timestamp updated automatically
- [x] Matches the `captured_at` of the new photo

**Verify:**
```sql
SELECT id, crop_name, last_photo_at FROM crops WHERE id = '<crop_id>';
SELECT captured_at FROM crop_media WHERE crop_id = '<crop_id>' ORDER BY captured_at DESC LIMIT 1;
-- Both timestamps should match
```

### Test: Proof Required for picked_up

**Steps:**
1. Start a trip as transporter
2. Click through to "Confirm Pickup"
3. Try to confirm WITHOUT capturing any proof photo

**Expected:**
- [x] Button disabled OR error: "Proof required before updating status"
- [x] Status remains at previous state

### Test: Proof Required for delivered

**Steps:**
1. Continue trip to "Confirm Delivery" 
2. Try to confirm WITHOUT proof photo

**Expected:**
- [x] Same behavior - proof required

---

## Phase 6: Farmer Module Demo Leakage Fix ✅

### Test: New Farmer Earnings

**Steps:**
1. Create brand new farmer account
2. Navigate to Earnings page

**Expected:**
- [x] Shows ₹0 for all stats (not fake numbers)
- [x] Empty transaction list with "No transactions yet"
- [x] Proper empty state message

### Test: Orders Real Data

**Steps:**
1. Check Orders page as farmer with no orders

**Expected:**
- [x] Shows empty state, not mock data
- [x] CTA to learn about marketplace

---

## Phase 7: Language System ✅

### Test: Language Toggle Persistence

**Steps:**
1. Go to Farmer Settings
2. Toggle language to Kannada
3. Refresh page

**Expected:**
- [x] UI stays in Kannada after refresh
- [x] Language preference saved in `profiles.preferred_language`

### Test: Toggle Back

**Steps:**
1. Toggle back to English
2. Refresh

**Expected:**
- [x] UI in English
- [x] DB updated to 'en'

---

## Phase 8: Market Prices 3-Tier Fallback ✅

### Test: Tier A (Personalized)

**Setup:** Farmer with district set + crops added

**Expected:**
- [x] Shows prices for farmer's crops in farmer's district
- [x] Label: "Prices for your crops in {district}"

### Test: Tier B (District Default)

**Setup:** Farmer with district but no crops

**Expected:**
- [x] Shows top 6 prices for district
- [x] Shows "Add your crops" info banner

### Test: Tier C (State Default)

**Setup:** New farmer without district

**Expected:**
- [x] Shows Karnataka-wide prices
- [x] Shows "Set your district" amber banner
- [x] Retry button on error

---

## Phase 9: Weather Widget Location Fallback ✅

### Test: No Location Set

**Setup:** New farmer without village/district/pincode

**Expected:**
- [x] Shows "Set your location" prompt
- [x] NO fake weather numbers displayed
- [x] MapPin icon in gray card

### Test: API Error with Retry

**Setup:** Farmer with location, API fails

**Expected:**
- [x] Shows error state with "Retry" button
- [x] No synthetic fallback data
- [x] Clear error message

---

## Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Error handling + loading states | ✅ |
| 1 | Race condition fix | ✅ |
| 2 | Consolidate mutations | ✅ |
| 3 | Upload compression + limits | ✅ |
| 4 | Agent RLS fix | ✅ |
| 5 | Guardrails (delete confirm, trigger, proof required) | ✅ |
| 6 | Farmer demo leakage fix | ✅ |
| 7 | Language system (EN/KN) | ✅ |
| 8 | Market prices 3-tier fallback | ✅ |
| 9 | Weather widget location fallback | ✅ |

Legend: ⬜ Not tested | ✅ Passed | ❌ Failed

---

## Files Modified

### Core Utilities
- `src/lib/error-utils.ts` - Error handling + file validation

### Transporter Flow
- `src/pages/logistics/AvailableLoads.tsx`
- `src/pages/logistics/ActiveTrips.tsx`
- `src/hooks/useLogisticsDashboard.tsx`
- `src/hooks/useTrips.tsx`
- `supabase/functions/update-trip-status/index.ts`

### Upload Components
- `src/components/crop-diary/CropPhotoUploadDialog.tsx`
- `src/components/farmer/soil-reports/SoilReportUploadDialog.tsx`
- `src/components/logistics/ProofCaptureDialog.tsx`
- `src/components/crop-diary/CropPhotoGallery.tsx`

### Farmer Module
- `src/pages/farmer/Earnings.tsx`
- `src/pages/farmer/Settings.tsx`
- `src/hooks/useFarmerEarnings.tsx`
- `src/hooks/useMarketData.tsx`
- `src/components/farmer/MarketPricesWidget.tsx`
- `src/components/farmer/WeatherWidget.tsx`

### i18n System
- `src/i18n/en.ts`
- `src/i18n/kn.ts`
- `src/i18n/index.ts`
- `src/hooks/useLanguage.tsx`

### Database Migrations
- RLS policy for `soil_test_reports` (agent assignments)
- Trigger for `crops.last_photo_at`
- Indexes on `market_orders`, `crops`, `transport_requests`
- `preferred_language` column on `profiles`
