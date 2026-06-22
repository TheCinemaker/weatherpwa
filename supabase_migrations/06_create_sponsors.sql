-- 1. Create table for sponsors/ads
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active and unexpired sponsors
CREATE POLICY "Allow public select access to sponsors" 
ON public.sponsors 
FOR SELECT 
USING (active = true AND expires_at > now());

-- Allow public write access to sponsors (insert, update, delete)
CREATE POLICY "Allow public write access to sponsors" 
ON public.sponsors 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsors;

-- 2. Create moments storage bucket configuration for sponsor logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sponsors', 'sponsors', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the sponsors bucket
CREATE POLICY "Allow public read access to sponsors bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'sponsors');

CREATE POLICY "Allow public upload access to sponsors bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sponsors');

CREATE POLICY "Allow public delete access to sponsors bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'sponsors');
