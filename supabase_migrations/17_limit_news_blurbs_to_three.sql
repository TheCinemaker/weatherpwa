-- 1. Nyilvános olvasás szabályának visszaállítása korlátlanra (nem járnak le 24 óra után)
DROP POLICY IF EXISTS "Public read news_blurbs" ON public.news_blurbs;
CREATE POLICY "Public read news_blurbs"
ON public.news_blurbs FOR SELECT USING (true);

-- 2. Régi takarító trigger és lejárati függvény eltávolítása
DROP TRIGGER IF EXISTS cleanup_expired_news_blurbs_trigger ON public.news_blurbs;
DROP FUNCTION IF EXISTS delete_expired_news_blurbs();

-- 3. Az expires_at oszlop értékének NULL-ra engedélyezése és alapértelmezett értékének eltávolítása
ALTER TABLE public.news_blurbs ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.news_blurbs ALTER COLUMN expires_at SET DEFAULT NULL;

-- 4. Már meglévő hírmorzsák lejárati dátumának törlése (hogy ne tűnjenek el)
UPDATE public.news_blurbs SET expires_at = NULL;

-- 5. Új trigger függvény létrehozása, amely csak a legfrissebb 3 hírmorzsát tartja meg
CREATE OR REPLACE FUNCTION public.keep_only_latest_three_news_blurbs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.news_blurbs
    WHERE id NOT IN (
        SELECT id 
        FROM public.news_blurbs 
        ORDER BY created_at DESC 
        LIMIT 3
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Új trigger beállítása beszúrás (INSERT) utánra
DROP TRIGGER IF EXISTS limit_news_blurbs_count_trigger ON public.news_blurbs;
CREATE TRIGGER limit_news_blurbs_count_trigger
AFTER INSERT ON public.news_blurbs
FOR EACH STATEMENT
EXECUTE FUNCTION public.keep_only_latest_three_news_blurbs();

-- 7. Adatbázisban lévő bejegyzések számának korlátozása 3-ra most azonnal is
DELETE FROM public.news_blurbs
WHERE id NOT IN (
    SELECT id 
    FROM public.news_blurbs 
    ORDER BY created_at DESC 
    LIMIT 3
);
