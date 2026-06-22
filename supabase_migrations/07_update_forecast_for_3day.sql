-- Add 3-day forecast columns to local_forecast table
ALTER TABLE public.local_forecast 
ADD COLUMN IF NOT EXISTS title_3day TEXT,
ADD COLUMN IF NOT EXISTS content_3day TEXT,
ADD COLUMN IF NOT EXISTS image_url_3day TEXT;

-- Update the existing forecast row with default mock values
UPDATE public.local_forecast
SET title_3day = '3 napos elemzés: Hétvégi lehűlés és csapadék',
    content_3day = 'A következő három napban jelentős változás áll be térségünk időjárásában. Egy érkező hidegfront hatására a hőmérséklet visszaesik, és több hullámban várható eső, zápor, zivatar. Szombaton még kitarthat a meleg, de vasárnaptól markáns lehűlésre és megerősödő északnyugati szélre kell számítani.',
    image_url_3day = 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800'
WHERE id = 1;
