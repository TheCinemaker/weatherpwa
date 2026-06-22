-- Add manual 3-day forecast card columns and 1-day image column to local_forecast table
ALTER TABLE public.local_forecast
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS card1_icon TEXT DEFAULT 'sun',
ADD COLUMN IF NOT EXISTS card1_desc TEXT DEFAULT 'Napos',
ADD COLUMN IF NOT EXISTS card1_temp_min NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS card1_temp_max NUMERIC DEFAULT 25,

ADD COLUMN IF NOT EXISTS card2_icon TEXT DEFAULT 'cloud-sun',
ADD COLUMN IF NOT EXISTS card2_desc TEXT DEFAULT 'Fátyolfelhős',
ADD COLUMN IF NOT EXISTS card2_temp_min NUMERIC DEFAULT 16,
ADD COLUMN IF NOT EXISTS card2_temp_max NUMERIC DEFAULT 26,

ADD COLUMN IF NOT EXISTS card3_icon TEXT DEFAULT 'cloud-rain',
ADD COLUMN IF NOT EXISTS card3_desc TEXT DEFAULT 'Záporok',
ADD COLUMN IF NOT EXISTS card3_temp_min NUMERIC DEFAULT 14,
ADD COLUMN IF NOT EXISTS card3_temp_max NUMERIC DEFAULT 22;

-- Update row 1 with default manual card data and mock image
UPDATE public.local_forecast
SET image_url = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800',
    card1_icon = 'sun',
    card1_desc = 'Derült, napos',
    card1_temp_min = 16,
    card1_temp_max = 31,
    
    card2_icon = 'cloud-sun',
    card2_desc = 'Gomolyfelhők, száraz',
    card2_temp_min = 17,
    card2_temp_max = 33,
    
    card3_icon = 'cloud-rain',
    card3_desc = 'Záporok, zivatarok',
    card3_temp_min = 15,
    card3_temp_max = 24
WHERE id = 1;
