-- Fix traceability-media: restrict SELECT to owner-based access
DROP POLICY IF EXISTS "Users can view own traceability media" ON storage.objects;
CREATE POLICY "Users can view own traceability media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'traceability-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix voice_media: restrict SELECT to owner-based access
DROP POLICY IF EXISTS "Authenticated users can read voice_media" ON storage.objects;
CREATE POLICY "Agents can read own voice_media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice_media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to read voice_media
CREATE POLICY "Admins can read all voice_media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice_media'
  AND has_role(auth.uid(), 'admin'::app_role)
);