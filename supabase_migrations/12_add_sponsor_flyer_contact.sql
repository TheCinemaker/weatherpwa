-- Hirdetésekhez: nagyobb flyer/plakát kép és elérhetőség (a részletes modálhoz).
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS flyer_url TEXT,
ADD COLUMN IF NOT EXISTS contact TEXT;
