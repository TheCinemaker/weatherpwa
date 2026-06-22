-- Add secondary temperature columns for 3-day forecast cards to support ranges (e.g. 20-22 °C)
ALTER TABLE public.local_forecast
ADD COLUMN IF NOT EXISTS card1_temp_min_2 NUMERIC,
ADD COLUMN IF NOT EXISTS card1_temp_max_2 NUMERIC,
ADD COLUMN IF NOT EXISTS card2_temp_min_2 NUMERIC,
ADD COLUMN IF NOT EXISTS card2_temp_max_2 NUMERIC,
ADD COLUMN IF NOT EXISTS card3_temp_min_2 NUMERIC,
ADD COLUMN IF NOT EXISTS card3_temp_max_2 NUMERIC;
