-- Create table for city moments (KőszegReels)
CREATE TABLE IF NOT EXISTS public.city_moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_url TEXT NOT NULL,
    caption TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours') NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.city_moments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all active moments
CREATE POLICY "Allow public read access to city_moments" 
ON public.city_moments 
FOR SELECT 
USING (expires_at > now());

-- Allow public insert access to post new moments
CREATE POLICY "Allow public insert access to city_moments" 
ON public.city_moments 
FOR INSERT 
WITH CHECK (true);

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_moments;

-- Create moments storage bucket configuration
-- Note: In Supabase, bucket creation can be done via SQL in the storage schema:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moments', 'moments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the moments bucket
CREATE POLICY "Allow public read access to moments bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'moments');

CREATE POLICY "Allow public upload access to moments bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'moments');
