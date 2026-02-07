
-- Feature 1: Add geo_verified to farmlands (location_lat/location_long already exist)
ALTER TABLE public.farmlands ADD COLUMN IF NOT EXISTS geo_verified boolean NOT NULL DEFAULT false;

-- Feature 2: Add geo fields to crop_media for geo-tagged photos
ALTER TABLE public.crop_media ADD COLUMN IF NOT EXISTS latitude numeric NULL;
ALTER TABLE public.crop_media ADD COLUMN IF NOT EXISTS longitude numeric NULL;
ALTER TABLE public.crop_media ADD COLUMN IF NOT EXISTS geo_verified boolean NOT NULL DEFAULT false;
