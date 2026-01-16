# Agri Mitra - Pilot P0 Checklist

This document tracks acceptance tests for P0 hardening phases.

---

## Phase 0: Prep for P0 Hardening

- [ ] All mutation errors show clear toast messages
- [ ] Error utility (`getErrorMessage`) extracts Supabase/Edge errors cleanly
- [ ] All action buttons disable while loading
- [ ] No silent failures in any flow

---

## Phase 1: Fix Transporter Accept Race Condition

### Test: Two Transporters Accept Same Load

**Setup:**
1. Open 2 browser tabs/windows logged in as 2 different transporter accounts
2. Navigate to `/logistics/loads` in both

**Steps:**
1. Find the same available load in both tabs
2. Click "Accept" in both tabs within 1 second
3. Confirm in both dialogs simultaneously

**Expected:**
- [ ] Only ONE transporter succeeds with "Load accepted successfully!" toast
- [ ] The OTHER gets "This load has already been accepted by another transporter" toast
- [ ] Database shows only 1 trip created for that transport_request
- [ ] Available loads list refreshes in both tabs (load disappears)

**Verify in DB:**
```sql
SELECT * FROM trips WHERE transport_request_id = '<id>';
-- Should return exactly 1 row

SELECT * FROM transport_status_events WHERE transport_request_id = '<id>';
-- Should show 1 assignment event
```

---

## Phase 2: Consolidate Transporter Mutations

### Test: No Direct DB Updates

- [ ] `useAcceptLoad` hook removed from `useLogisticsDashboard.tsx`
- [ ] `useUpdateTripStatus` hook removed from `useLogisticsDashboard.tsx`
- [ ] `AvailableLoads.tsx` uses `useAcceptLoadSecure` from `useTrips.tsx`
- [ ] `ActiveTrips.tsx` uses secure hooks from `useTrips.tsx`
- [ ] All status updates go through edge functions

**Verify:**
```bash
# Search codebase - should find 0 matches in pages
grep -r "useAcceptLoad\|useUpdateTripStatus" src/pages/
```

---

## Phase 3: Upload Hardening

### Test: Large Image Compression

**Steps:**
1. Go to Crop Diary for any crop
2. Click "Upload Photo"
3. Select a 10MB+ image

**Expected:**
- [ ] Shows "Compressing..." state
- [ ] Then shows "Uploading..."
- [ ] Upload succeeds
- [ ] Final uploaded image < 2MB in storage

### Test: Oversized Image Rejection

**Steps:**
1. Try to upload a 20MB image in any upload dialog

**Expected:**
- [ ] Toast: "File too large. Maximum size is 15MB"
- [ ] Upload blocked before network request

### Test: PDF Size Limit

**Steps:**
1. Go to Soil Reports
2. Try to upload a 15MB PDF

**Expected:**
- [ ] Toast: "File too large. Maximum size is 10MB"
- [ ] Upload blocked

### Test: Upload Failure Retry

**Steps:**
1. Simulate network failure during upload (DevTools -> Offline)
2. Attempt upload

**Expected:**
- [ ] Clear error toast with "Retry" action button
- [ ] Click Retry → re-attempts upload
- [ ] Loading state resets properly

---

## Phase 4: Agent Soil Report RLS

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
- [ ] Upload succeeds
- [ ] Report visible in farmer's soil report history
- [ ] `consent_captured = true` in database

### Test: Agent Without Assignment Blocked

**Steps:**
1. Try to upload soil report for farmer NOT in `agent_farmer_assignments`

**Expected:**
- [ ] Error: "You don't have permission for this farmer"

---

## Phase 5: Trust & Data Integrity

### Test: Crop Photo Delete Confirmation

**Steps:**
1. Go to Crop Diary photo gallery
2. Click delete on any photo

**Expected:**
- [ ] Confirmation dialog appears: "Delete this photo? This cannot be undone."
- [ ] Cancel → photo remains
- [ ] Confirm Delete → photo removed

### Test: last_photo_at Server Trigger

**Steps:**
1. Upload a photo for a crop
2. Check crop record in database

**Expected:**
- [ ] `last_photo_at` timestamp updated automatically
- [ ] Matches the `captured_at` of the new photo

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
- [ ] Button disabled OR error: "Proof required before updating status"
- [ ] Status remains at previous state

### Test: Proof Required for delivered

**Steps:**
1. Continue trip to "Confirm Delivery" 
2. Try to confirm WITHOUT proof photo

**Expected:**
- [ ] Same behavior - proof required

---

## Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Error handling + loading states | ⬜ |
| 1 | Race condition fix | ⬜ |
| 2 | Consolidate mutations | ⬜ |
| 3 | Upload compression + limits | ⬜ |
| 4 | Agent RLS fix | ⬜ |
| 5 | Guardrails (delete confirm, trigger, proof required) | ⬜ |

Legend: ⬜ Not tested | ✅ Passed | ❌ Failed
