-- Add missing Vijayanagara district
INSERT INTO karnataka_districts (district)
VALUES ('Vijayanagara')
ON CONFLICT (district) DO NOTHING;

-- Fix/add tomato Kannada aliases (Tomate is actually a common romanization, add proper Kannada script)
INSERT INTO crop_aliases (canonical_name, alias, language_code)
VALUES 
  ('Tomato', 'ಟೊಮೆಟೊ', 'kn'),
  ('Tomato', 'ಟಮಾಟೋ', 'kn')
ON CONFLICT DO NOTHING;

-- Add proper Kannada script aliases for other common crops
INSERT INTO crop_aliases (canonical_name, alias, language_code)
VALUES 
  ('Rice', 'ಅಕ್ಕಿ', 'kn'),
  ('Onion', 'ಈರುಳ್ಳಿ', 'kn'),
  ('Potato', 'ಆಲೂಗಡ್ಡೆ', 'kn'),
  ('Maize', 'ಮೆಕ್ಕೆಜೋಳ', 'kn'),
  ('Sugarcane', 'ಕಬ್ಬು', 'kn'),
  ('Groundnut', 'ಕಡಲೆಕಾಯಿ', 'kn'),
  ('Cotton', 'ಹತ್ತಿ', 'kn'),
  ('Chilli', 'ಮೆಣಸಿನಕಾಯಿ', 'kn'),
  ('Coconut', 'ತೆಂಗಿನಕಾಯಿ', 'kn'),
  ('Banana', 'ಬಾಳೆಹಣ್ಣು', 'kn'),
  ('Mango', 'ಮಾವು', 'kn'),
  ('Jowar', 'ಜೋಳ', 'kn'),
  ('Tur Dal', 'ತೊಗರಿ', 'kn'),
  ('Coffee', 'ಕಾಫಿ', 'kn'),
  ('Areca Nut', 'ಅಡಿಕೆ', 'kn'),
  ('Ragi', 'ರಾಗಿ', 'kn'),
  ('Wheat', 'ಗೋಧಿ', 'kn'),
  ('Paddy', 'ಭತ್ತ', 'kn')
ON CONFLICT DO NOTHING;

-- Ensure segment_key has unique constraint (already pk, but make sure)
-- farmer_segments segment_key is already primary key per types.ts

-- Add indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_market_prices_agg_district_crop 
ON market_prices_agg(district, crop_name);

CREATE INDEX IF NOT EXISTS idx_agri_advisories_district_crop 
ON agri_advisories(district, crop_name);

-- Ensure web_fetch_logs has segment_key column (check and add if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'web_fetch_logs' AND column_name = 'segment_key'
    ) THEN
        ALTER TABLE web_fetch_logs ADD COLUMN segment_key text;
    END IF;
END $$;