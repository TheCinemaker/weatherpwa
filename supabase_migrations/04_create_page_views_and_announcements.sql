-- 1. Add announcement columns to local_forecast table if they don't exist
ALTER TABLE public.local_forecast 
ADD COLUMN IF NOT EXISTS announcement_text TEXT,
ADD COLUMN IF NOT EXISTS announcement_active BOOLEAN DEFAULT false NOT NULL;

-- Update the initial forecast row with mock values
UPDATE public.local_forecast
SET announcement_text = 'Figyelem! Zivatarveszély és erős szél várható az Alpokalján a délutáni órákban!',
    announcement_active = false
WHERE id = 1;

-- 2. Create table for tracking page views
CREATE TABLE IF NOT EXISTS public.page_views (
    page_name TEXT PRIMARY KEY,
    views_count BIGINT DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Allow public select on page_views" 
ON public.page_views 
FOR SELECT 
USING (true);

-- All policy for public access (fallback to select/upsert)
CREATE POLICY "Allow public insert and update on page_views" 
ON public.page_views 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert initial seed
INSERT INTO public.page_views (page_name, views_count)
VALUES ('main', 1)
ON CONFLICT (page_name) DO NOTHING;

-- 3. Create RPC function to increment views atomically
CREATE OR REPLACE FUNCTION public.increment_page_view(p_name text)
RETURNS bigint AS $$
DECLARE
    new_count bigint;
BEGIN
    INSERT INTO public.page_views (page_name, views_count)
    VALUES (p_name, 1)
    ON CONFLICT (page_name)
    DO UPDATE SET views_count = public.page_views.views_count + 1
    RETURNING views_count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
