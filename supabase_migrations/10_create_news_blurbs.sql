-- Hírmorzsák: Laci rövid, aktuális híreihez (pl. "2026 első trópusi éjszakája").
CREATE TABLE IF NOT EXISTS public.news_blurbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.news_blurbs ENABLE ROW LEVEL SECURITY;

-- Nyilvános olvasás; az írás/törlés UI-szinten (admin PIN) védett, mint a többi tábla.
DROP POLICY IF EXISTS "Public read news_blurbs" ON public.news_blurbs;
CREATE POLICY "Public read news_blurbs"
ON public.news_blurbs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert news_blurbs" ON public.news_blurbs;
CREATE POLICY "Public insert news_blurbs"
ON public.news_blurbs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update news_blurbs" ON public.news_blurbs;
CREATE POLICY "Public update news_blurbs"
ON public.news_blurbs FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete news_blurbs" ON public.news_blurbs;
CREATE POLICY "Public delete news_blurbs"
ON public.news_blurbs FOR DELETE USING (true);
