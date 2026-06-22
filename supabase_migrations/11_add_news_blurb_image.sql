-- Opcionális kép a hírmorzsákhoz.
ALTER TABLE public.news_blurbs
ADD COLUMN IF NOT EXISTS image_url TEXT;
