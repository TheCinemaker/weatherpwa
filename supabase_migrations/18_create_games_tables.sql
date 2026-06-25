-- 1. Kvíz dicsőségfal tábla létrehozása
CREATE TABLE IF NOT EXISTS public.quiz_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    time_seconds INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS engedélyezése
ALTER TABLE public.quiz_leaderboard ENABLE ROW LEVEL SECURITY;

-- Politikák a kvíz táblához (bárki olvashatja és beszúrhat eredményt)
DROP POLICY IF EXISTS "Allow public read quiz_leaderboard" ON public.quiz_leaderboard;
CREATE POLICY "Allow public read quiz_leaderboard" ON public.quiz_leaderboard 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert quiz_leaderboard" ON public.quiz_leaderboard;
CREATE POLICY "Allow public insert quiz_leaderboard" ON public.quiz_leaderboard 
FOR INSERT WITH CHECK (true);


-- 2. Tippelde előrejelzések tábla létrehozása
CREATE TABLE IF NOT EXISTS public.tippelde_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    prediction NUMERIC NOT NULL,
    target_date DATE NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (name, target_date)
);

-- RLS engedélyezése
ALTER TABLE public.tippelde_predictions ENABLE ROW LEVEL SECURITY;

-- Politikák a tippelde előrejelzésekhez (bárki olvashatja és beküldhet tippet)
DROP POLICY IF EXISTS "Allow public read tippelde_predictions" ON public.tippelde_predictions;
CREATE POLICY "Allow public read tippelde_predictions" ON public.tippelde_predictions 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert tippelde_predictions" ON public.tippelde_predictions;
CREATE POLICY "Allow public insert tippelde_predictions" ON public.tippelde_predictions 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update/delete tippelde_predictions" ON public.tippelde_predictions;
CREATE POLICY "Allow public update/delete tippelde_predictions" ON public.tippelde_predictions 
FOR ALL USING (true) WITH CHECK (true);


-- 3. Tippelde ranglista/pontszámok tábla létrehozása
CREATE TABLE IF NOT EXISTS public.tippelde_scores (
    name TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0 NOT NULL,
    predictions_count INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS engedélyezése
ALTER TABLE public.tippelde_scores ENABLE ROW LEVEL SECURITY;

-- Politikák a tippelde ranglistához (bárki olvashatja és frissítheti)
DROP POLICY IF EXISTS "Allow public read tippelde_scores" ON public.tippelde_scores;
CREATE POLICY "Allow public read tippelde_scores" ON public.tippelde_scores 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write tippelde_scores" ON public.tippelde_scores;
CREATE POLICY "Allow public write tippelde_scores" ON public.tippelde_scores 
FOR ALL USING (true) WITH CHECK (true);


-- 4. Supabase Realtime bekapcsolása a dicsőségfalakhoz
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'quiz_leaderboard'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_leaderboard;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'tippelde_scores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tippelde_scores;
    END IF;
END $$;
