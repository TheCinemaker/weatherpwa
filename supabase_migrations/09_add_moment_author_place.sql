-- Add optional author name and free-text place name to city moments (Reels).
ALTER TABLE public.city_moments
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS place_name TEXT;
