-- Create table for local forecast (Ráduly László helyzetjelentése)
CREATE TABLE IF NOT EXISTS public.local_forecast (
    id INTEGER PRIMARY KEY DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.local_forecast ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the forecast
CREATE POLICY "Allow public read access to local_forecast" 
ON public.local_forecast 
FOR SELECT 
USING (true);

-- Allow public write access to local_forecast (insert, update, delete)
CREATE POLICY "Allow public write access to local_forecast" 
ON public.local_forecast 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.local_forecast;

-- Insert initial mock forecast row
INSERT INTO public.local_forecast (id, title, content, updated_at)
VALUES (1, 'Helyzetjelentés: Lassú felmelegedés és záporok esélye', 'A mai napon a kőszegi hegyek felől érkező hűvösebb légtömegek hatása fokozatosan gyengül. Lassú felmelegedésre számíthatunk, de a délutáni órákban a megnövekvő fátyolfelhőzetből lokális záporok alakulhatnak ki. A csapadék mennyisége várhatóan 1-3 mm között mozog majd.', now())
ON CONFLICT (id) DO NOTHING;
