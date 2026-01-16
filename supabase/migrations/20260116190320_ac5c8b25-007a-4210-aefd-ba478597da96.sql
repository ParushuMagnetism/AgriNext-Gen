-- Phase 4: Fix Agent Soil Report RLS (use agent_farmer_assignments instead of agent_data)
DROP POLICY IF EXISTS "Agents can insert for assigned farmers" ON soil_test_reports;

CREATE POLICY "Agents can insert for assigned farmers with consent"
ON soil_test_reports
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND source_role = 'agent'
  AND consent_captured = true
  AND EXISTS (
    SELECT 1 FROM agent_farmer_assignments
    WHERE agent_id = auth.uid() 
    AND farmer_id = soil_test_reports.farmer_id
  )
);

-- Phase 5: Create trigger to auto-update crops.last_photo_at when photo is uploaded
CREATE OR REPLACE FUNCTION update_crop_last_photo_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crops
  SET last_photo_at = COALESCE(NEW.captured_at, NEW.created_at)
  WHERE id = NEW.crop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_crop_last_photo_at ON crop_media;

CREATE TRIGGER trigger_update_crop_last_photo_at
AFTER INSERT ON crop_media
FOR EACH ROW
EXECUTE FUNCTION update_crop_last_photo_at();