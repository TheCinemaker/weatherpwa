-- 1. Régi táblák eldobása
DROP TABLE IF EXISTS public.tippelde_scores CASCADE;
DROP TABLE IF EXISTS public.tippelde_predictions CASCADE;
DROP TABLE IF EXISTS public.quiz_leaderboard CASCADE;

-- 2. Új tippelde előrejelzések tábla létrehozása player_id-val
CREATE TABLE public.tippelde_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    name TEXT NOT NULL,
    prediction NUMERIC NOT NULL,
    target_date DATE NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    points_earned INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (player_id, target_date)
);

-- RLS engedélyezése
ALTER TABLE public.tippelde_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tippelde_predictions" ON public.tippelde_predictions FOR SELECT USING (true);
CREATE POLICY "Allow public insert tippelde_predictions" ON public.tippelde_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update/delete tippelde_predictions" ON public.tippelde_predictions FOR ALL USING (true) WITH CHECK (true);

-- 3. Új összesített tippelde pontok tábla létrehozása player_id-val
CREATE TABLE public.tippelde_scores (
    player_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    predictions_count INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS engedélyezése
ALTER TABLE public.tippelde_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tippelde_scores" ON public.tippelde_scores FOR SELECT USING (true);
CREATE POLICY "Allow public write tippelde_scores" ON public.tippelde_scores FOR ALL USING (true) WITH CHECK (true);

-- 4. Új Kvíz dicsőségfal tábla létrehozása napi korláttal
CREATE TABLE public.quiz_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    time_seconds INTEGER NOT NULL,
    created_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (player_id, created_date)
);

-- RLS engedélyezése
ALTER TABLE public.quiz_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read quiz_leaderboard" ON public.quiz_leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public insert quiz_leaderboard" ON public.quiz_leaderboard FOR INSERT WITH CHECK (true);

-- 5. Heti ranglista nézet létrehozása (elmúlt 7 nap alapján összesít)
CREATE OR REPLACE VIEW public.tippelde_weekly_scores AS
SELECT 
    player_id,
    max(name) as name,
    sum(points_earned) as points,
    count(*) as predictions_count
FROM public.tippelde_predictions
WHERE target_date >= (CURRENT_DATE - INTERVAL '7 days') AND processed = true
GROUP BY player_id;

-- 6. Supabase Realtime bekapcsolása a táblákhoz
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'tippelde_scores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tippelde_scores;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'quiz_leaderboard'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_leaderboard;
    END IF;
END $$;
