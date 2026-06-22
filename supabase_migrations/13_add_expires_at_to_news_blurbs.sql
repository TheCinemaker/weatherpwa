-- Add expires_at column to news_blurbs, default to 24 hours from creation
ALTER TABLE public.news_blurbs
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours') NOT NULL;

-- Update the public select policy to only return active news (non-expired)
DROP POLICY IF EXISTS "Public read news_blurbs" ON public.news_blurbs;
CREATE POLICY "Public read news_blurbs"
ON public.news_blurbs FOR SELECT USING (expires_at > now());

-- Create a function that deletes expired news blurbs
CREATE OR REPLACE FUNCTION delete_expired_news_blurbs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.news_blurbs WHERE expires_at < now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs after every insert to clean up expired news blurbs from database
DROP TRIGGER IF EXISTS cleanup_expired_news_blurbs_trigger ON public.news_blurbs;
CREATE TRIGGER cleanup_expired_news_blurbs_trigger
AFTER INSERT ON public.news_blurbs
FOR EACH STATEMENT
EXECUTE FUNCTION delete_expired_news_blurbs();

-- Enable Realtime for the news_blurbs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'news_blurbs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.news_blurbs;
    END IF;
END $$;
